module.export = {
    apps: [{
        name: 'texsa-API',
        script: 'app.js',
        env_staging: {
            NODE_ENV: "production"
        },
    }],
};