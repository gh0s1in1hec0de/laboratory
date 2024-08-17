import Elysia from "elysia";
import { getGreeting } from "./handlers.ts";

export const userRoutes = new Elysia({ prefix: "/user" })
    .get("/", () => getGreeting());
