class Route {
    constructor(service, path, method, queryParameters, pathVariables, headers, body, roles) {
        this.service            = service;
        this.path               = path;
        this.method             = method;
        this.queryParameters    = queryParameters;
        this.pathVariables      = pathVariables;
        this.headers            = headers;
        this.body               = body;
        this.roles              = roles;
    }

    toString() {
        return `{
            service: ${this.service},
            path: ${this.path},
            method: ${this.method},
            queryParameters: ${this.queryParameters},
            pathVariables: ${this.pathVariables},
            headers: ${this.headers},
            body: ${this.body},
            roles: ${this.roles}
        }`;
    };
}

module.exports = Route;