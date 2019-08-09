function userValidate() {

    var username = $("input[name=username]").val();
    var password = $("input[name=password]").val();

    if (username != '' && password != '') {
        return true;
    }

    document.getElementById('error_message').style.display = 'block';
    document.getElementById('error_message').innerHTML = "Pleae fill all the required fields!"
    return false;

}