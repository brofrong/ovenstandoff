import { z } from "zod";

const dbSchema = z.object({
    currentID: z.number().default(0),
});

let db: z.infer<typeof dbSchema>;

const pathToDB = "./db.json";

async function initDB() {
    if(!(await Bun.file(pathToDB).exists())) {
        db = {
            currentID: 0,
        };
        await Bun.write(pathToDB, JSON.stringify(db, null, 2));
    }
}
