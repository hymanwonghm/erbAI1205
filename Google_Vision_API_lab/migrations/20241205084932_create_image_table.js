
exports.up = function(knex) {
    return knex.schema.createTable("image", (table) => {
        table.increments("id").primary();
        table.text("name", 128).notNullable();
        table.text("detected_label", 128).notNullable();
        table.text("joyLikelihood", 128);
        table.text("sorrowLikelihood", 128);
        table.text("angerLikelihood", 128);
        table.text("surpriseLikelihood", 128);
        table.text("underExposedLikelihood", 128);
        table.text("blurredLikelihood", 128);
        table.text("headwearLikelihood", 128);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists("image");
};
