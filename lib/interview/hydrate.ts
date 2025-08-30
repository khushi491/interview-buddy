export function hydrateMessagesFromResponses(responses: any[]): any[] {
    let msgIdx = 0;
    const messages: any[] = [];
    for (const entry of responses) {
        messages.push({
            id: `ai-${msgIdx}-${entry.timestamp || Date.now()}`,
            role: "assistant",
            content: entry.question,
            sectionId: entry.sectionId,
            timestamp: entry.timestamp,
        });
        msgIdx++;
        if (entry.answer) {
            messages.push({
                id: `user-${msgIdx}-${entry.timestamp || Date.now()}`,
                role: "user",
                content: entry.answer,
                sectionId: entry.sectionId,
                timestamp: entry.timestamp,
            });
            msgIdx++;
        }
    }
    return messages;
} 