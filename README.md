# Roku Suite version 1.0.0

Roku suite was built with Roku channel development in minf It's the ability to add multiple version of a project as well as multiple Roku devices. There is a built in remote wioth key logging ability. Logs acan also be saved into playlists.

## Basic Usage

### Add a project

Open add project window
```
cmnd A or Projects > Add
```

In add prject window
```
Choose directory to your Roku channel project.
Path and project name will be autofilled but can be changed.
Exclude Files is for any files that should be excluded from side loading.
NOTE. Any files/directories that begin with '.' will lautomatically be excluded from the packaging process for side load deployments.
```

Save Project
```
click save
```

### Add a Roku
Open add Roku window
```
Rokus > Add
```

In add Roku window
```
Fill in fields ip address, device name, username, and password.
Ip address is the address to your Roku on your network. ex. 10.10.10.99
Device name can be whatever you want comes prefilled with My Roku.
Username is the username for ypu roku comes prefilled as rokudev.
Password is the password to your Roku usually set after enabling developer mode.
```

Save Roku
```
Click save and Roku will be added to Roku's pane as well as the Select Roku for deployment dropdown.
```

### Deploy to a Roku

Select Roku 
```
Ensure the Roku you want to deploy to is selected in the top dropdown in the main window.
```

Click Deploy
```
Click deploy on the project that you wish to be side loaded in the projects pane.
```

### Key Press Logger

Open logger
```
In the tools pane at the bottom of the remote there is toggle key logger.
```

Once toggled active
```
A key logger window will open and begin logging presses from the remote in the main window. Individual key presses can be move within the key logger window. As well the cog in the top right of the key logger window will open a key logger menu that will give options to save, play, pause the set of key logs. which can later found in the key logs pane.
```

### Multiple Rokus

Select multiple Rokus
```
To selecte multiple Rokus from main dropdown hold down Ctrl while selecting.
```

Note
```
While multiple Rokus are selected they can be controlled with the remote and deployed to.
```

### Auto Deploy

While auto deploy is activated
```
While auto deploy is active any changes made to files that are not excluded from normal side loading will trigger automatic side loading of the project that has the Auto Deploy button activated.
```

### Removal of Projects, Rokus, Key Logs
To remove
```
To remove any project, Roku, or key log just simply simply drag it while in the main window into the trash can that will appear on start of drag.
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites



NodeJS

```
https://nodejs.org/en/
```

Git

```
https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
```

Electron

```
https://electronjs.org/docs/tutorial/installation
```

### Installing

Clone The repo

```
git clone https://github.com/CCecilia/roku-suite-desktop.git
```

CD into rokuSuiteDesktop

```
cd roku-suite-desktop/
```

Install Dependencies

```
npm install
```

Check dependency installation(optional)

```
npm ls
```

Start the app

```
npm start
```

## Running the tests

```
npm test
```

## Built With

* [Node](http://www.dropwizard.io/1.0.2/docs/) - Framework
* [Electron](https://electronjs.org/) - Framework
* See package.json for all dependecies

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Christian Cecilia** - *Initial work* - [FuboTV](https://github.com/fubotv)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [RokuDev](https://github.com/rokudev)
