const Datastore = require('nedb');
const electron = require('electron');
const path = require('path');
const userDataPath = (electron.app || electron.remote.app).getPath('userData');

const Projects = new Datastore({ filename: path.join(userDataPath, 'data', 'projects.db'), autoload: true });
const Rokus = new Datastore({ filename: path.join(userDataPath, 'data', 'rokus.db'), autoload: true });
const KeyLogLists = new Datastore({ filename: path.join(userDataPath, 'data', 'keyLogLists.db'), autoload: true });

module.exports = {
	Projects: Projects, 
	Rokus: Rokus, 
	KeyLogLists: KeyLogLists
};
