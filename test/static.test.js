import { existsSync } from "fs";

assertEquals(existsSync(_path("static")), true, "/static not copied");