const yaml = require('js-yaml');
const { MongoClient } = require("mongodb");
const Route = require('./route.js');

function getParameter(ref, components) {
    const parameter = ref.replace(/^#\//, '').split('/').pop();

    if (parameter in components.parameters) {
        return components.parameters[parameter];
    }
}

async function fetchAPIRoutes() {
    const apiDocsServicesPaths = [
        "https://raw.githubusercontent.com/GY-CODING/api-docs/refs/heads/master/reference/heralds-of-chaos.openapi.yaml",
        "https://raw.githubusercontent.com/GY-CODING/api-docs/refs/heads/master/reference/gy-accounts.openapi.yaml",
        "https://raw.githubusercontent.com/GY-CODING/api-docs/refs/heads/master/reference/gy-messages.openapi.yaml"
    ];

    const routes = new Array();

    for (const servicePath of apiDocsServicesPaths) {
        const response = await fetch(servicePath);
        const yamlText = await response.text();
        const openApiSpec = yaml.load(yamlText);

        const paths = openApiSpec.paths;

        for (const path in paths) {
            for (const method in paths[path]) {
                const route = paths[path][method];
                const parameters = route.parameters || [];
                const roles = route['x-roles'] || [];

                const resolvedParameters = parameters.map(param => {
                    if (param.$ref) {
                        return getParameter(param.$ref, openApiSpec.components);
                    }
                    return param;
                });

                const queryParameters = resolvedParameters.filter(p => p.in === 'query');
                const pathVariables = resolvedParameters.filter(p => p.in === 'path');
                const headers = resolvedParameters.filter(p => p.in === 'header');
                const body = route.requestBody ? route.requestBody.content : null;

                const routeObject = new Route(
                    "/" + openApiSpec.servers[0].url.split('/')[3],
                    path,
                    method.toUpperCase(),
                    queryParameters,
                    pathVariables,
                    headers,
                    body,
                    roles
                );

                routes.push(routeObject);
            }
        }
    }

    return routes;
}

async function insert() {
    const dbUrl = "mongodb+srv://gycoding:iggycoding-05@fallofthegods.zsllqn9.mongodb.net"
    const dbName = "APIGateway"
    const collectionName = "APIDocs"
    const client = new MongoClient(dbUrl);

    const routes = await fetchAPIRoutes();

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        await collection.deleteMany({});
        console.log("Database flushed.");

        const result = await collection.insertMany(routes);
        console.log(`${result.insertedCount} documents saved.`);

        return result;
    } catch (error) {
        console.error("Error inserting document:", error);
    } finally {
        await client.close();
    }
}

insert();