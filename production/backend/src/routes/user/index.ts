import Elysia from "elysia";
import { getGreeting } from "./handlers";

export const userRoutes = new Elysia({ prefix: "/user" })
    .get("/", () => getGreeting());
