// IMAGE UPLOAD
let imageFile = document.querySelector('#image-upload');
const removeBtn = document.querySelector('#remove-image-btn');
const uploadBtn = document.querySelector('#upload-btn');
const imgCheck = document.querySelectorAll('.img-check input');
const infoText = document.querySelector('#info-text');

// const removeCurrentPhoto = document.querySelector('.remove-photo');

imgCheck.forEach(el => el.addEventListener('change', uploadDeleteBtnSwitch))

// Image Edit
function uploadDeleteBtnSwitch() {
        const checkedArr = [];
        
        for (const check of imgCheck) {
            if (check.checked) {
                checkedArr.push(check)
            }
        }
        if (checkedArr.length > 0) {
            if (imageFile) { 
                imageFile.value = ""; 
                removeBtn.classList.add('hide');
            }
            
            infoText.textContent = ((checkedArr.length == 1) ? `${checkedArr.length} file selected` : `${checkedArr.length} files selected`)
            
            uploadBtn.classList.remove('hide');
            uploadBtn.classList.remove('btn-success');
            uploadBtn.classList.add('btn-danger');
            uploadBtn.textContent = 'Delete'
        } else {
            infoText.innerHTML = "";
            uploadBtn.classList.add('hide');
            uploadBtn.classList.remove('btn-danger');
            uploadBtn.classList.add('btn-success');
            uploadBtn.textContent = 'Upload'
        }
}

if (imageFile) {
    imageFile.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length != 0) {
            removeBtn.classList.remove('hide');
            uploadBtn.classList.remove('hide');

            infoText.textContent = ((files.length == 1) ? `1 file` : `${files.length} files`) + " will be uploaded" ;
            uploadBtn.classList.remove('btn-danger');
            uploadBtn.classList.add('btn-success');
            uploadBtn.textContent = 'Upload'
            for (const check of imgCheck) {
                check.checked = false;
            }
        } else {
            removeBtn.classList.add('hide');
            uploadBtn.classList.add('hide');
        }
    })

    removeBtn.addEventListener('click', function() {
        imageFile.value = "";
        infoText.innerHTML = "";
        removeBtn.classList.add('hide');
        uploadBtn.classList.add('hide');
        removeCurrentPhoto.classList.remove('hide');
    });
}
