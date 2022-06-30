db.createUser({
    user: 'localroot',
    pwd: 'localpass',
    roles: [
        {
            role: 'readWrite',
            db: 'kaetram_e2e'
        }
    ]
});
