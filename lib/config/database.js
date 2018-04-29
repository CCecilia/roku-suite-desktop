const Datastore = require('nedb');
const Projects = new Datastore({ filename: 'projects.db', autoload: true });
const Rokus = new Datastore({ filename: 'rokus.db', autoload: true });

module.exports = {Projects: Projects, Rokus: Rokus}
