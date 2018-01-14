var queryAllPageTimeInterval = 60 * 60 * 1000; // 1hr
var singleQueryTimeInterval = 10 * 1000; //10s

// debug
// var queryAllPageTimeInterval = 5 * 1000; // 5s
// var singleQueryTimeInterval = 1000; // 1s

function queryPage(id){
    // console.log("query " + id);
    var userUrl = "https://www.g-cores.com/users/" + id;
    $.get(userUrl ,function(data){
        var article = getArticleIdAndDateFromHTML(data);
        var articleDate = new Date(article.date);
        // console.log("to query");
        chrome.storage.sync.get(id,function(raw){
            console.log(raw[id]);
            // console.log("sent query");
            var originFields = JSON.parse(raw[id]);
            var lastDate = new Date(originFields[2]);
            if (originFields[2] == "") // user never post an article
                lastDate = new Date('1970-01-01');

            if (articleDate.getTime() > lastDate.getTime()){
                newFields = originFields;
                newFields[1] = article.id;
                newFields[2] = article.date;
                var newData = {};
                newData[id+""] = JSON.stringify(newFields);
                chrome.storage.sync.set(newData);
                // localStorage.setItem(id,JSON.stringify(newFields));
                chrome.notifications.create(article.id, {
                    type: "basic",
                    iconUrl : "icon.png",
                    title: article.title,
                    message : "By " + originFields[0],
                    buttons :[
                        {
                            title: "Read"
                        },
                        {
                            title: "Ignore"
                        }
                    ]
                });
                // end if for date comparasion
            }
            // end callback for sendMessage
        })
    })
}
function queryAllPages(){
    // console.log("query all page");
    chrome.storage.sync.get(null, function(items) {
        var ids = Object.keys(items);
        var timeout = function(i){        
            if (i < ids.length){
                queryPage( ids[i] )
                // console.log(ids[i]);
                setTimeout( function(){
                    timeout(i+1)
                },singleQueryTimeInterval)
            }
        }
        timeout(0);
    });
}

function getUserNameFromHTML(page){
    var pattern = /<p class="user_name">\n\s*(.*)\n/g;
    var matches = pattern.exec(page);
    if (matches != null && matches.length == 2 ){
        return matches[1];
    }
    return null;
}

function getArticleIdAndDateFromHTML(page){
    var pattern = /g-cores\.com\/articles\/([0-9]+)">\n.*\n.*\n\s+(.*)\n.*\n.*\n\s+<img src="(.*?)\?.*\n.*\n\s+<h4>(.*)<\/h4>/g;
    var matches = pattern.exec(page);
    if (matches !=null){
        articleId = matches[1];
        articleDate = matches[2];
        img = matches[3];
        title = matches[4];
        return {
            id: articleId,
            date: articleDate,
            img: img,
            title:title
        };
    }
    return null;
}
// communicating with frontend
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request)
        if (request.type == "find-user-name"){
            var userUrl = "https://www.g-cores.com/users/" + request.id;
            $.get(userUrl ,function(data){
                var userName = getUserNameFromHTML(data);
                var article = getArticleIdAndDateFromHTML(data);
                console.log(article);
                sendResponse({
                    status: userName ? "success" : "fail",
                    userId: request.id,
                    userName: userName,
                    article: article
                })
            }).fail(function(){
                sendResponse({
                    status: "fail"
                })
            })
            return true;
        }
        

        if (request.type == "DBInsert"){
            var data = request.userData;
            var field = [data.userName,data.articleId,data.articleDate];
            // // console.log(field);
            var saveData = {};
            saveData[data.userId] = JSON.stringify(field);
            chrome.storage.sync.set(saveData, function() {
                sendResponse({status:"success"});
            });
            return true;
        }
        if (request.type == "DBInit"){

        }
        if (request.type == "DBDelete"){
            var userId = request.userId;
            chrome.storage.sync.remove(userId,function(){
                sendResponse({status:"success"});
            });
            return true;            
        }
        if (request.type == "DBQuery"){
            console.log("query");
            var id = request.id;
            chrome.storage.sync.get(id,function(raw){
                var field = JSON.parse(raw);
                if (field){
                    sendResponse({
                        status:"success",
                        field: field
                    })
                } else{
                    sendResponse({
                        status: "fail"
                    })
                }
            })
            return true;
        }
        if (request.type == "DBGetAll"){
            chrome.storage.sync.get(null, function (savedData) {
                var ids = Object.keys(savedData);
                var num = ids.length;
                var names = [];
                var articleIds = [];
                var articleDates = [];
                for (var i=0; i < num; i++){
                    var id = ids[i];
                    var fields = JSON.parse(savedData[id]);
                    names.push(fields[0])
                    articleIds.push(fields[1]);
                    articleDates.push(fields[2]);
                }
                var data = [ids,names,articleIds,articleDates];
                // console.log(data);
                sendResponse({
                    status: "success",
                    number: num,
                    data: [ids,names,articleIds,articleDates]
                })
            });
            return true;
        }
        if (request.type == "DBGetAllKeys"){
            // console.log("query all keys");
            chrome.storage.sync.get(null, function(items) {
                var allKeys = Object.keys(items);
                sendResponse({
                    status:"success",
                    keys : allKeys
                })
            });
            return true;
        }
        if (request.type == "DEBUG__showSyncData"){
            chrome.storage.sync.get(null, function (data) {
                console.info(data)
            });
            // chrome.storage.sync.get(null, function(items) {
            //     var allKeys = Object.keys(items);
            //     console.log(allKeys);
            // });
        }
        if (request.type == "DEBUG__changeLastUpdatedTime"){
            chrome.storage.sync.get(null, function (data) {
                var allKeys = Object.keys(data);
                var id = -1;
                for (var i=0; i < allKeys.length; i++){
                    var key = allKeys[i];
                    var field = JSON.parse(data[key]);
                    if (field[2] != ""){
                        id = i;
                        break;
                    }
                }
                // if (id == -1){
                //     sendResponse({
                //         status: "nodata"
                //     });
                // }
                console.log(field[2]);
                var date = new Date(field[2]);
                date -= 24 * 60 * 60 * 1000;
                var beforeDate = new Date(date).toISOString().slice(0,10);
                console.log(beforeDate);
                field[2] = beforeDate;
                var save = {};
                save[key] = JSON.stringify(field);
                chrome.storage.sync.set(save);
                // end callback
            });
            return true;
        }
});

chrome.notifications.onButtonClicked.addListener(function(articleId, buttonId){
    if (buttonId == 0){
        chrome.tabs.create({ url: "https://www.g-cores.com/articles/" + articleId });
    }
    chrome.notifications.clear(articleId);
    
})
setInterval(function(){
    queryAllPages();
},queryAllPageTimeInterval);
