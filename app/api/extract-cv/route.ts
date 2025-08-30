import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import mammoth from "mammoth";
import { storage } from "@/lib/storage";

const AZURE_ENDPOINT = process.env.AZURE_OCR_ENDPOINT as string;
const AZURE_KEY = process.env.AZURE_OCR_KEY as string;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const allowedTypes = [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/msword", // DOC
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Unsupported file type. Please upload PDF, DOC, DOCX, PNG, or JPEG files." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = "";

        if (
            file.type === "application/msword" ||
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            // DOC or DOCX: use mammoth for DOCX; mammoth doesn't handle .doc, but covers 95% of modern resumes.
            try {
                const mammothResult = await mammoth.extractRawText({ buffer });
                extractedText = mammothResult.value;
            } catch (err) {
                return NextResponse.json(
                    { error: "Failed to extract text from DOC/DOCX. Try converting to PDF." },
                    { status: 500 }
                );
            }
        } else {
            // Use Azure OCR for PDFs and images
            const analyzeResponse = await axios.post(AZURE_ENDPOINT, buffer, {
                headers: {
                    "Ocp-Apim-Subscription-Key": AZURE_KEY,
                    "Content-Type": file.type,
                },
                maxBodyLength: Infinity,
            });
            const operationLocation = analyzeResponse.headers["operation-location"];
            if (!operationLocation) {
                return NextResponse.json(
                    { error: "Failed to get operation location from Azure" },
                    { status: 500 }
                );
            }

            // Poll for OCR completion
            let ocrResult;
            for (let tries = 0; tries < 15; tries++) {
                await new Promise((res) => setTimeout(res, 2000));
                const resultResponse = await axios.get(operationLocation, {
                    headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY },
                });
                if (
                    resultResponse.data.status === "succeeded" ||
                    resultResponse.data.status === "failed"
                ) {
                    ocrResult = resultResponse.data;
                    break;
                }
            }

            if (!ocrResult || ocrResult.status !== "succeeded") {
                return NextResponse.json(
                    { error: "OCR processing timed out or failed" },
                    { status: 500 }
                );
            }

            // Aggregate text from all pages/lines
            const readResults = ocrResult.analyzeResult?.readResults || [];
            for (const page of readResults) {
                for (const line of page.lines || []) {
                    extractedText += line.text + "\n";
                }
            }
        }

        // For demo purposes, create a resume entry with a demo user ID
        let resumeId: string | undefined = undefined;
        try {
            const demoUserId = `demo-user-${Date.now()}`;
            const resume = await storage.createResume(demoUserId, extractedText.trim());
            resumeId = resume.id;
        } catch (saveErr) {
            // Non-fatal: we still return extracted content
            console.error("Autosave resume failed:", saveErr);
        }

        return NextResponse.json({
            success: true,
            content: extractedText.trim(),
            fileName: file.name,
            fileSize: file.size,
            resumeId,
        });
    } catch (error: any) {
        console.error("Azure OCR error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: "Failed to analyze file." },
            { status: 500 }
        );
    }
} 