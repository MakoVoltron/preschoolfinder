// IMAGE UPLOAD
let imageFile = document.querySelector('#image-upload');
const removeBtn = document.querySelector('#remove-image-btn');
const uploadBtn = document.querySelector('#upload-btn');
// const imgCheck = document.querySelectorAll('.img-check input');
const infoText = document.querySelector('#info-text');

const removePhotoContainer = document.querySelector('.remove-photo');
const removePhotoCheckbox = document.querySelector('#remove-photo');
const removeProfileText = document.querySelector('.remove-photo-label');
const removeProfileConfirm = document.querySelector('.remove-photo-confirm-btn');


imageFile.addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length != 0) {
        removeBtn.classList.remove('hide');
        uploadBtn.classList.remove('hide');
        
        infoText.textContent = "1 file will be uploaded";
        uploadBtn.classList.remove('btn-danger');
        uploadBtn.classList.add('btn-success');
        uploadBtn.textContent = 'Upload'
        if (removePhotoContainer != null) {
            removePhotoCheckbox.checked = false;
            removePhotoContainer.classList.add('hide');
        }

    } else {
        removeBtn.classList.add('hide');
        uploadBtn.classList.add('hide');
        removePhotoContainer ? removePhotoContainer.classList.remove('hide') : '';
    }
})

removeBtn.addEventListener('click', function() {
    imageFile.value = "";
    infoText.innerHTML = "";
    removeBtn.classList.add('hide');
    uploadBtn.classList.add('hide');
    removePhotoContainer ? removePhotoContainer.classList.remove('hide') : '';
});

if (removePhotoCheckbox != null) {
    removePhotoCheckbox.addEventListener('change', (e) => {
        if (e.target.checked === true) {
            removeProfileConfirm.classList.remove('hide');
        } else {
            removeProfileConfirm.classList.add('hide');
        }
    })
}
