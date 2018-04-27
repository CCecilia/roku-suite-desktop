// handle new project
ipcRenderer.on('new_project', (e, new_project) => {
    // update mainWindow with new project;
    let project_html = `
        <div class="col-4 project-card clickable">
            <div class="row">
                <div class="col-12 text-center">
                    <h4 class="roku-font">${new_project.name}</h4>
                    <p class="text-muted">${new_project.git_branch}</p>
                </div>
                <div class="col-12 text-center">
                    <div class="dropdown">
                        <button class="btn btn-roku btn-block dropdown-toggle" type="button" data-toggle="dropdown">
                            Select Roku
                        </button>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#">Cooper</a>
                    </div>
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
});


$('document').ready(function(e) {
    // handle side bar clicks
    $('.sidebar-nav').click(function(e) {
        let nav_target = $(this).attr('data-target');
        console.log(nav_target);
    });
});
