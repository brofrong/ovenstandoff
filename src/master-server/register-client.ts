import { z } from "zod";
import { registerClientsSchema, RegisterClientsResponse } from './messages.schema';
import { env } from "./env";

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


export async function handleRegisterClients(req: Request) {
    const body = await req.json();
    const parsedBody = registerClientsSchema.safeParse(body);
    if (!parsedBody.success) {
        return new Response("Invalid request", { status: 400 });
    }

    const { count } = parsedBody.data;

    const resData = await registerClients(count);

    const returnData: RegisterClientsResponse = [];

    const emails = env.EMAILS;
    const emailsLength = emails.length;
    const passwords = env.PASSWORDS;
    const passwordsLength = passwords.length;

    for (let i = resData.startID; i < resData.endID; i++) {
        returnData.push({
            name: `CH auto ${i + 1}`,
            nameIsChanged: false,
            lowSettings: false,
            email: env.EMAILS[i % emailsLength],
            password: env.PASSWORDS[i % passwordsLength],
        });
    }

    return new Response(JSON.stringify(returnData), { status: 200 });
}


