import { parseTasksInputToMergedMap } from "../src/bot/handlers/common.ts";
import { Locales, parseLocaledText } from "starton-periphery";
import { beforeAll, describe, test, expect } from "bun:test";

describe("Task Parsing", () => {
    beforeAll(async () => {
        // Set up any required test configurations or dependencies here
    });

    describe("parseTasksInputToMergedMap", () => {
        test("parses valid input with multiple tasks", async () => {
            const input = `\
ru:ФрэндТех|Описание задачи%en:FriendTech|Task description
---
ru:Другая задача|Другое описание%en:Another task|Another description\
`;
            const input2 = `\
            ru:taskName1|subtaskName1&subtaskDescription1%en:taskName1|subtaskName1&subtaskDescription1
            ---
            ru:Другая задача|Другое описание%en:Another task|Another description\
            `;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(2);
            expect(result.tasksByLocale.get("ru:ФрэндТех%en:FriendTech"))
                .toBe("ru:Описание задачи%en:Task description");
            expect(result.tasksByLocale.get("ru:Другая задача%en:Another task"))
                .toBe("ru:Другое описание%en:Another description");
            expect(result.errors.length).toBe(0);
        });

        test("handles invalid locales gracefully", async () => {
            const input = `\
xx:InvalidLocale|Some description
---
ru:ФрэндТех|Описание задачи%en:FriendTech|Task description\
`;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(1);
            expect(result.tasksByLocale.get("ru:ФрэндТех%en:FriendTech"))
                .toBe("ru:Описание задачи%en:Task description");
            expect(result.errors).toContain("Invalid locale 'xx' in task block 1");
        });

        test("handles empty task blocks", async () => {
            const input = `\
ru:ФрэндТех|Описание задачи%en:FriendTech|Task description
---
---
ru:Другая задача|Другое описание%en:Another task|Another description\
`;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(2);
            expect(result.errors).toContain("Task block 2 is empty or invalid");
        });

        test("handles input with only one task", async () => {
            const input = "\
ru:ФрэндТех|Описание задачи%en:FriendTech|Task description\
";
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(1);
            expect(result.tasksByLocale.get("ru:ФрэндТех%en:FriendTech"))
                .toBe("ru:Описание задачи%en:Task description");
            expect(result.errors.length).toBe(0);
        });

        test("handles completely invalid task blocks", async () => {
            const input = `\
Invalid data
---
ru:ФрэндТех|Описание задачи%en:FriendTech|Task description\
`;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(1);
            expect(result.errors).toContain("No valid task data found in task block 1");
        });
    });

    describe("parseLocaledText", () => {
        test("parses valid localized text", async () => {
            const input = "ru:ФрэндТех%en:FriendTech";
            const input2 = "ru:subtaskName1&subtaskDescription1%en:subtaskName1&subtaskDescription1";
            const result = parseLocaledText(input);
            expect(result.size).toBe(2);
            expect(result.get(Locales.RU)).toBe("ФрэндТех");
            expect(result.get(Locales.EN)).toBe("FriendTech");
        });

        test("throws error for invalid locale in localized text", async () => {
            const input = "xx:InvalidLocale%en:FriendTech";
            expect(() => parseLocaledText(input)).toThrow("Invalid locale 'xx' in localized text");
        });

        test("handles single locale localized text", async () => {
            const input = "ru:ФрэндТех";
            const result = parseLocaledText(input);
            expect(result.size).toBe(1);
            expect(result.get(Locales.RU)).toBe("ФрэндТех");
        });

        test("handles extra whitespace in localized text", async () => {
            const input = " ru : ФрэндТех % en : FriendTech ";
            const result = parseLocaledText(input);
            expect(result.size).toBe(2);
            expect(result.get(Locales.RU)).toBe("ФрэндТех");
            expect(result.get(Locales.EN)).toBe("FriendTech");
        });
    });
});
