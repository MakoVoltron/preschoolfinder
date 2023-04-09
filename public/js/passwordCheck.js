let password = document.getElementById('password-signup')
let confirmPassword = document.getElementById('password-signup-confirm');
let passMsg = document.querySelector('.password-feedback');
let confirmPassMsg = document.querySelector('.passwordconfirm-feedback');

function checkPassword() {
    
    if (password.value.length != 0) {
        if (password.value.length > 5) {
            passMsg.style.display = 'block';
            passMsg.textContent = "Looks good!"
            passMsg.classList.remove('invalid-feedback');
            passMsg.classList.add('valid-feedback');

            if (password.value == confirmPassword.value) {
                console.log("Passwords are matching")
                passMsg.style.display = 'block';
                confirmPassMsg.style.display = 'block'
                confirmPassMsg.textContent = 'Looks good!'
                confirmPassMsg.classList.remove('invalid-feedback')
                confirmPassMsg.classList.add('valid-feedback')
                return
            } 
            
            if (confirmPassword.value.length == 0) {
                console.log('type your password')
                console.log(confirmPassword.value.length)
                confirmPassMsg.style.display = 'block';
                confirmPassMsg.classList.remove('valid-feedback')
                confirmPassMsg.classList.add('invalid-feedback')
                confirmPassMsg.textContent = 'Confirm your password!'
            } else {
                console.log("Passwords are not matching")
                // passMsg.style.display = 'none';
                confirmPassMsg.style.display = 'block';
                confirmPassMsg.classList.remove('valid-feedback')
                confirmPassMsg.classList.add('invalid-feedback')
                confirmPassMsg.textContent = 'Passwords are not matching!'
            }
        } else {
            passMsg.textContent = "Your password must be at least 6 characters."
            passMsg.classList.add('invalid-feedback');
            passMsg.style.display = 'block';
        }

    }
}

[password, confirmPassword].forEach(el => {
    el.addEventListener('change', checkPassword)
})



password.addEventListener('change', function() {
    confirmPassword.value = "";
})

password.addEventListener("keydown", function(e) {
    passMsg.style.display = 'none';

    if (event.which === 8) {
        confirmPassMsg.style.display = 'none';
        password.value = "";
        confirmPassword.value = "";
    }
})