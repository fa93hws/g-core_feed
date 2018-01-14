var DOMList = {};
DOMList.addUser = {};
DOMList.addUser.result = $("#add-user-by-id-result");
DOMList.addUser.button = $("#add-user-by-id-button");
DOMList.addUser.txtbox = $("#add-user-by-id-txtbox");
DOMList.addUser.resdiv = $("#add-user-by-id-resdiv");

DOMList.confirm = {};
DOMList.confirm.div = $("#add-user-confirm-div");
DOMList.confirm.id = $("#add-user-confirm-id");
DOMList.confirm.name = $("#add-user-confirm-name");
DOMList.confirm.button = $("#add-user-confirm-button");
DOMList.confirm.articleId = $("#add-user-confirm-last-article-id");
DOMList.confirm.articleDate = $("#add-user-confirm-last-article-date");

DOMList.latest = {};
DOMList.latest.div = $("#latest-div");
// init
function init(){
    chrome.runtime.sendMessage({type:"DBInit"});
    renderTable();
}

//
function sortByLastDate(articleDates){
    var idx = [];
    var ticks = [];
    for (var i=0; i < articleDates.length; i++){
        idx.push(i);
        ticks.push(new Date(articleDates[i]).getTime());
    }
    // console.log(new Date(articleDates[0]));
    for (var i=0; i < articleDates.length-1; i++){
        for (var j=i+1; j < articleDates.length; j++){
            if (ticks[i] < ticks[j]){
                var temp = ticks[j];
                ticks[j] = ticks[i];
                ticks[i] = temp;

                temp = idx[j];
                idx[j] = idx[i];
                idx[i] = temp;
            }
        }
    }
    return idx;
}
function renderTable(){
    DOMList.latest.div.html("");
    chrome.runtime.sendMessage({type:"DBGetAll"},function(response){
        // console.log(response);
        var num = response.number;
        var ids = response.data[0];
        var names = response.data[1];
        var articleIds = response.data[2];
        var articleDates = response.data[3];
        var idx = sortByLastDate(articleDates);
        var table = "<table id=\"user-table\">";
        for (var i=0;i<idx.length;i++){
            table += "<tr class=\"center\">";
            table += "<td class=\"id-textbox hide\">" + ids[idx[i]] + "</td>";
            table += "<td class=\"name-td\">" + names[idx[i]] + "</td>";
            // table += "<td>" + articleIds[i] + "</td>";
            table += "<td class=\"date-td\">" + articleDates[idx[i]].slice(2) + "</td>";
            table += "<td class=\"delete-td\" name=\"1-" + (i+1) + "\"><p>x</p></td>";
            table += "</tr>"
        }
        table += "</table>";
        DOMList.latest.div.html(table);
        $(".delete-td").click(function(){
            var name = $(this).attr("name");
            var temp = name.split('-');
            var page = temp[0];
            var row = temp[1];
            var originIdx = idx[row-1];
            var userName = names[originIdx]
            var r = confirm("Delete user " + userName + " ?");
            if (r== true){
                chrome.runtime.sendMessage({type:"DBDelete",userId:ids[originIdx]},function(response){
                    renderTable();
                });            
            }
        })
    })
}
function showDivAfterSearch(response){
    DOMList.addUser.button.prop("disabled",false);
    if (response.status === "success"){
        DOMList.addUser.result.addClass("hide");
        DOMList.confirm.div.removeClass("hide");
        DOMList.confirm.div.addClass("show");
        DOMList.confirm.id.val(response.userId);
        DOMList.confirm.name.val(response.userName);
        if (response.article){
            DOMList.confirm.articleId.val(response.article.id);
            DOMList.confirm.articleDate.val(response.article.date);
        }
    } else{
        DOMList.addUser.result.text("user not found")
    }
    
}
function findUserById(id,callback){
    console.log(id);
    var message = {
        type:"find-user-name",
        id: id
    }
    chrome.runtime.sendMessage(message, function(response){
        callback(response);
    });
}

function resetResult(){
    DOMList.addUser.resdiv.removeClass("hide");
    DOMList.addUser.resdiv.addClass("show");
    DOMList.addUser.result.text("");
    resetConfirm();
}
function resetConfirm(){
    DOMList.confirm.div.removeClass("show");
    DOMList.confirm.div.addClass("hide");
    DOMList.confirm.id.val("");
    DOMList.confirm.name.val("");
    DOMList.confirm.articleId.val("");
    DOMList.confirm.articleDate.val("");
}
// bind button action
DOMList.addUser.button.click(function(){
    resetResult();
    // enter dev mode
    if (DOMList.addUser.txtbox.val()==="dev"){
        $("#devpage").removeClass("hide");
        $("#devpage").addClass("show");
        return;
    }
    // is empty
    if (DOMList.addUser.txtbox.val()===""){
        DOMList.addUser.result.text("User id shall not be empty");
        return;
    }
    var addSuccess = false;
    var userId = parseInt(DOMList.addUser.txtbox.val());
    // is number
    if (isNaN(userId)){
        addSuccess = true;
        DOMList.addUser.result.text("user id must be a number");
        return;
    } else{
        DOMList.addUser.result.text("finding user...");
        DOMList.addUser.button.prop("disabled",true);
        findUserById(userId,function(response){
            showDivAfterSearch(response);
        })
    }
})

DOMList.confirm.button.click(function(){
    var userData = {};
    userData.userId = DOMList.confirm.id.val();
    userData.userName = DOMList.confirm.name.val();
    userData.articleId = DOMList.confirm.articleId.val();
    userData.articleDate = DOMList.confirm.articleDate.val();
    chrome.runtime.sendMessage({type:"DBInsert",userData},function(response){
        resetConfirm();
        renderTable();
    });
})

init();