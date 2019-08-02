let config = {
    PORT: 8003,
    PREFIX: '/project-api',
    TOKEN: {
        SECRET: 'FGREG^%$T$RW@#ET$Q##RQW1',
        MAX_DURATION: 1000 * 60 * 60 * 24 * 7,
        DURATION: 1000 * 60 * 60
    },
    MONGO: {
        USERNAME: '',
        PASSWORD: '',
        HOST: 'localhost',
        PORT: '27017',
        DATABASE: 'project_board'
    },
    INITIAL_USER: {
        USERNAME: 'admin',
        NAME: 'Administrator',
        PASSWORD: 'admin'
    },
    PAGINATION: {
        OFFSET_FIELD: 'offset',
        LIMIT_FIELD: 'limit',
        DEFAULT_LIMIT: 20
    },
    SORT: {
        FIELD: 'sort'
    }
}

export default config