exports.up = function (knex) {
  return knex.schema.createTable("image", (table) => {
    table.increments("id").primary();
    table.text("name", 128).notNullable();
    table.text("face_detected").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("image");
};
