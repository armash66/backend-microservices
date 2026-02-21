exports.up = (pgm) => {
    pgm.createTable('tasks', {
        id: { type: 'serial', primaryKey: true },
        user_id: { type: 'integer', notNull: true },
        title: { type: 'varchar(255)', notNull: true },
        description: { type: 'text' },
        status: { type: 'varchar(50)', default: 'pending' },
        created_at: {
            type: 'timestamp',
            default: pgm.func('current_timestamp')
        }
    });

    // Example: How to enforce referential integrity if we were using a single monolithic schema.
    // We won't do it right now to keep task-service functionally isolated, 
    // but this is where you would place foreign keys or indices!
    pgm.createIndex('tasks', 'user_id');
};

exports.down = (pgm) => {
    pgm.dropTable('tasks');
};
