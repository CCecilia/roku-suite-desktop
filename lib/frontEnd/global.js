const {ipcRenderer} = require('electron');

function handleInputError(element) {
    element.css('border', '1px solid red').focus();

    setTimeout(() => {
        element.css('border', '');
    }, 2000);
}

function addProjectCardToWindow(project) {
    // update mainWindow with new project;
    let project_html = `
        <div class="col-4 project-card clickable">
            <div class="row">
                <div class="col-12 text-center">
                    <h4 class="roku-font">${project.name}</h4>
                    <p class="text-muted">${project.git_branch}</p>
                </div>
                <div class="col-12 text-center pad-4">
                    <button class="btn btn-success btn-block">
                        Deploy
                    </button>
                </div>
            </div>
        </div>
    `;
    $('#projects').append(project_html);
}
