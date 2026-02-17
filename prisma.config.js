const { defineConfig } = require("prisma/config");
require("dotenv").config({ path: ".env.local" });

module.exports = defineConfig({
    engineType: "library",
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL || "file:./dev.db",
    },
});
