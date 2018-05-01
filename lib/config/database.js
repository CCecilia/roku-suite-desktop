const Datastore = require('nedb');
const Projects = new Datastore({ filename: 'data/projects.db', autoload: true });
const Rokus = new Datastore({ filename: 'data/rokus.db', autoload: true });

module.exports = {Projects: Projects, Rokus: Rokus}
