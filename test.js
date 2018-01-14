$("#test-button").click(function(){
    var addUserResult = addUserTest();
    if (addUserResult > -1){
        $("#test-result").text("add user test fail at case " + addUserResult);
        return;
    }
    $("#test-result").text("all good");
})

function addUserTest(){
    var testCase = [
        ["","user id shall not be empty"],
        ["ab","user id must be a number"],
        ["123","finding user..."]
    ];
    // 
    var numTest = testCase.length;
    for (var i=0; i < numTest; i++){
        $("#add-user-by-id-txtbox").val(testCase[i][0]);
        $("#add-user-by-id-button").trigger("click");
        if ($("#add-user-by-id-result").text() != testCase[i][1])
            return i;
    }
    return -1;
}