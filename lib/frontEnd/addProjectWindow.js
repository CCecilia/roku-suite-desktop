const branch = require('git-branch');

Array.prototype.lastElem = function() {
    return this[this.length - 1];
}

let excluded_file_paths = [];

$('document').ready(function(e) {
    // handle choose directory dropdown
    $('#add-project').change( function(e) {

        // fill form inputs
        let project_path = $(this)[0].files[0].path;
        let project_name = project_path.split('/').lastElem();

        $('#project_path').val(project_path);

        if( !$('#project_name').val() ) {
            $('#project_name').val(project_name);
        }
    });

    // handle excluded files
    $('#exclude-files').change(function(e) {
        excluded_file_paths = [];
        $('#excluded_file_paths').empty();

        let excluded_files = $(this)[0].files;

        for( let i=0; i<excluded_files.length; i++ ) {
            excluded_file_paths.push(excluded_files[i].path);
            let html = `<li class="excluded-file clickable" data-toggle="tooltip" onmouseover="$(this).tooltip('show')" title="${excluded_files[i].path}">${excluded_files[i].name}</li>`;
            $('#excluded_file_paths').append(html);
        }
    });

    // create new project
    $('form[name="add-project-form"]').submit((e) => {
        // stop form submission
        e.preventDefault();

        // validate
        let name = $('#project_name');
        let path = $('#project_path');
        if (!name.val() ) {
            handleInputError(name);
            return;
        } else {
            // scrub
            name = name.val().trim()
        }
        if (!path.val() ) {
            handleInputError(path);
            return
        } else {
            // scrub
            path = path.val().trim();
        }

        // create new project
        let new_project_data = {
            name: name,
            root_path: path,
            excluded_file_paths: excluded_file_paths
        };

        branch(new_project_data.root_path)
        .then((name) => {
            console.log('in branching');
            new_project_data.git_branch = name;
            ipcRenderer.send('new_project', new_project_data);
        })
        .catch((error) => {
            console.log(error);
            ipcRenderer.send('new_project', new_project_data);
        });
    });
});
