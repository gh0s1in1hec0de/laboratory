import { parseTasksInputToMergedMap } from "../src/bot/handlers/common.ts";
import { Locales, parseLocaledText } from "starton-periphery";
import { beforeAll, describe, test, expect } from "bun:test";

// export function formatTime(totalSeconds: number) {
//     const days = Math.floor(totalSeconds / (3600 * 24));
//     const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const secs = totalSeconds % 60;

//     return {
//         days: String(days).padStart(2, "0"),
//         hours: String(hours).padStart(2, "0"),
//         minutes: String(minutes).padStart(2, "0"),
//         seconds: String(secs).padStart(2, "0"),
//     };
// }

describe("Task Parsing", () => {
    beforeAll(async () => {
        // Set up any required test configurations or dependencies here
    });

    describe("parseTasksInputToMergedMap", () => {
        // test("test format time", async () => {
        //     const timings = {
        //         "endTime": 1734076106,
        //         "startTime": 1733941166,
        //         "wlRoundEndTime": 1733941826,
        //         "publicRoundEndTime": 1733942186,
        //         "creatorRoundEndTime": 1733941466
        //     };
        //     const { phase, nextPhaseIn } = getCurrentSalePhase(timings);
        //     console.log(nextPhaseIn);
        //     // const { days, hours, minutes, seconds } = formatTime(nextPhaseIn || 0);
        //     const { days, hours, minutes, seconds } = formatTime(timings.endTime - Math.floor(Date.now() / 1000));
        //     console.log(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        // });
        test("parses valid input with multiple tasks", async () => {
            const input = `\
ru::ФрэндТех|Описание задачи%en::FriendTech|Task description
---
ru::Другая задача|Другое описание%en::Another task|Another description\
`;
            const input2 = `\
            ru::taskName1|subtaskName1&subtaskDescription1%en::taskName1|subtaskName1&subtaskDescription1
            ---
            ru::Другая задача|Другое описание%en::Another task|Another description\
            `;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(2);
            expect(result.tasksByLocale.get("ru::ФрэндТех%en::FriendTech"))
                .toBe("ru::Описание задачи%en::Task description");
            expect(result.tasksByLocale.get("ru::Другая задача%en::Another task"))
                .toBe("ru::Другое описание%en::Another description");
            expect(result.errors.length).toBe(0);
        });

        test("handles invalid locales gracefully", async () => {
            const input = `\
xx::InvalidLocale|Some description
---
ru::ФрэндТех|Описание задачи%en::FriendTech|Task description\
`;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(1);
            expect(result.tasksByLocale.get("ru::ФрэндТех%en::FriendTech"))
                .toBe("ru::Описание задачи%en::Task description");
            expect(result.errors).toContain("Invalid locale 'xx' in task block 1");
        });

        test("handles empty task blocks", async () => {
            const input = `\
ru::ФрэндТех|Описание задачи%en::FriendTech|Task description
---
---
ru::Другая задача|Другое описание%en::Another task|Another description\
`;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(2);
            expect(result.errors).toContain("Task block 2 is empty or invalid");
        });

        test("handles input with only one task", async () => {
            const input = "\
ru::ФрэндТех|Описание задачи%en::FriendTech|Task description\
";
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(1);
            expect(result.tasksByLocale.get("ru::ФрэндТех%en::FriendTech"))
                .toBe("ru::Описание задачи%en::Task description");
            expect(result.errors.length).toBe(0);
        });

        test("handles completely invalid task blocks", async () => {
            const input = `\
Invalid data
---
ru::ФрэндТех|Описание задачи%en::FriendTech|Task description\
`;
            const result = parseTasksInputToMergedMap(input);
            expect(result.tasksByLocale.size).toBe(1);
            expect(result.errors).toContain("No valid task data found in task block 1");
        });
    });

    describe("parseLocaledText", () => {
        test("parses valid localized text", async () => {
            const input = "ru::ФрэндТех%en::FriendTech";
            const input2 = "ru::subtaskName1&subtaskDescription1%en::subtaskName1&subtaskDescription1";
            const result = parseLocaledText(input);
            expect(result.size).toBe(2);
            expect(result.get(Locales.RU)).toBe("ФрэндТех");
            expect(result.get(Locales.EN)).toBe("FriendTech");
        });

        test("throws error for invalid locale in localized text", async () => {
            const input = "xx::InvalidLocale%en::FriendTech";
            expect(() => parseLocaledText(input)).toThrow("Invalid locale 'xx' in localized text");
        });

        test("handles single locale localized text", async () => {
            const input = "ru::ФрэндТех";
            const result = parseLocaledText(input);
            expect(result.size).toBe(1);
            expect(result.get(Locales.RU)).toBe("ФрэндТех");
        });

        test("handles extra whitespace in localized text", async () => {
            const input = " ru :: ФрэндТех % en :: FriendTech ";
            const result = parseLocaledText(input);
            expect(result.size).toBe(2);
            expect(result.get(Locales.RU)).toBe("ФрэндТех");
            expect(result.get(Locales.EN)).toBe("FriendTech");
        });
    });

    describe("parseLocaledText with complex message", () => {
        test("parses complex message with multiple parts", async () => {
            const input = "\
ru::X Hunters|Подпишитесь на @StartonX в X media&[Вот здесь!](https://x.com/startonX)&Liker&Поставьте лайк 3 постам StartonX в X&Reply King&Ответьте на [пост SOON](https://x.com/startonX/status/1866404332947570906) своим кошельком!%en::X Hunters|Follow @StartonX on X media&[Here it is!](https://x.com/startonX)&Liker&Like at least 3 StartonX posts on X&Reply King&Reply to [SOON post](https://x.com/startonX/status/1866404332947570906) with your wallet!\
";
            const result = parseLocaledText(input);

            expect(result.size).toBe(2);
            expect(result.get(Locales.RU)).toBe(
                "X Hunters|Подпишитесь на @StartonX в X media&[Вот здесь!](https://x.com/startonX)&Liker&Поставьте лайк 3 постам StartonX в X&Reply King&Ответьте на [пост SOON](https://x.com/startonX/status/1866404332947570906) своим кошельком!"
            );
            expect(result.get(Locales.EN)).toBe(
                "X Hunters|Follow @StartonX on X media&[Here it is!](https://x.com/startonX)&Liker&Like at least 3 StartonX posts on X&Reply King&Reply to [SOON post](https://x.com/startonX/status/1866404332947570906) with your wallet!"
            );
        });

        test("handles invalid locale with complex message", async () => {
            const input = "\
xx::X Hunters|Invalid locale example%en::X Hunters|Follow @StartonX on X media&[Here it is!](https://x.com/startonX)&Liker&Like at least 3 StartonX posts on X&Reply King&Reply to [SOON post](https://x.com/startonX/status/1866404332947570906) with your wallet!\
";
            expect(() => parseLocaledText(input)).toThrow("Invalid locale 'xx' in localized text");
        });

        test("handles single locale in complex message", async () => {
            const input = "\
ru::X Hunters|Подпишитесь на @StartonX в X media&[Вот здесь!](https://x.com/startonX)&Liker&Поставьте лайк 3 постам StartonX в X&Reply King&Ответьте на [пост SOON](https://x.com/startonX/status/1866404332947570906) своим кошельком!\
";
            const result = parseLocaledText(input);

            expect(result.size).toBe(1);
            expect(result.get(Locales.RU)).toBe(
                "X Hunters|Подпишитесь на @StartonX в X media&[Вот здесь!](https://x.com/startonX)&Liker&Поставьте лайк 3 постам StartonX в X&Reply King&Ответьте на [пост SOON](https://x.com/startonX/status/1866404332947570906) своим кошельком!"
            );
        });
    });

});
