exports.up = (pgm) => {
    pgm.createTable('users', {
        id: { type: 'serial', primaryKey: true },
        email: { type: 'varchar(255)', notNull: true, unique: true },
        password: { type: 'varchar(255)', notNull: true },
        created_at: {
            type: 'timestamp',
            default: pgm.func('current_timestamp')
        }
    });
};

exports.down = (pgm) => {
    pgm.dropTable('users');
};
