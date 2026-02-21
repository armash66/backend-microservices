exports.up = (pgm) => {
    pgm.createTable('files', {
        id: { type: 'serial', primaryKey: true },
        user_id: { type: 'integer', notNull: true },
        original_name: { type: 'varchar(255)', notNull: true },
        file_path: { type: 'varchar(255)', notNull: true },
        mime_type: { type: 'varchar(100)' },
        size: { type: 'bigint' },
        created_at: {
            type: 'timestamp',
            default: pgm.func('current_timestamp')
        }
    });

    // Explicit indexing for querying by user_id
    pgm.createIndex('files', 'user_id');
};

exports.down = (pgm) => {
    pgm.dropTable('files');
};
