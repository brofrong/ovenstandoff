import { z } from "zod";

const dbSchema = z.object({
    currentID: z.number().default(0),
});

let db: z.infer<typeof dbSchema>;

const pathToDB = "./db.json";

export async function initDB() {
    if (!(await Bun.file(pathToDB).exists())) {
        db = {
            currentID: 0,
        };
        saveDB(db);
    } else {
        const safeParse = dbSchema.safeParse(JSON.parse(await Bun.file(pathToDB).text()));
        if (!safeParse.success) {
            throw new Error("Invalid DB");
        }
        db = safeParse.data;
    }
}

async function saveDB(newValue: z.infer<typeof dbSchema>) {
    await Bun.write(pathToDB, JSON.stringify(newValue));
}

export async function registerClients(count: number) {
    const startID = db.currentID;
    const newID = db.currentID + count;
    db.currentID = newID;
    await saveDB(db);
    return { startID: startID, endID: newID };
}


