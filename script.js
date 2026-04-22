// ===============================
// FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
getAuth,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
query,
orderBy,
deleteDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ===============================
// FIREBASE CONFIG
// ===============================
const firebaseConfig = {
apiKey: "AIzaSyBSUWfXI0ymdpLUj50a66RtChT2KNNUVb4",
authDomain: "myblog-2e769.firebaseapp.com",
projectId: "myblog-2e769",
storageBucket: "myblog-2e769.firebasestorage.app",
messagingSenderId: "334369224950",
appId: "1:334369224950:web:1700bbb52729f4c15794d7",
measurementId: "G-VB61HH3TPQ"
};


// ===============================
// INIT
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===============================
// GLOBALS
// ===============================
window.isAdmin = false;
window.blogDocs = [];
window.blogData = [];
window.currentBlogIndex = null;


// ===============================
// MODAL CONTROLS
// ===============================
window.openAdmin = () =>
document.getElementById("loginModal").style.display = "flex";

window.closeLogin = () =>
document.getElementById("loginModal").style.display = "none";

window.closeAdmin = () =>
document.getElementById("adminPanel").style.display = "none";

window.closeView = () =>
document.getElementById("viewBlog").style.display = "none";


// ===============================
// ADMIN LOGIN
// ===============================
window.login = async function(){

try{

await signInWithEmailAndPassword(
auth,
document.getElementById("email").value.trim(),
document.getElementById("password").value
);

window.isAdmin = true;

closeLogin();

document.getElementById("adminPanel").style.display = "flex";

loadBlogs();

}catch(error){

alert(error.message);

}

};


// ===============================
// PUBLISH REVIEW
// ===============================
window.publishBlog = async function(){

const title = document.getElementById("title").value.trim();
const content = document.getElementById("content").value.trim();
const theme = document.getElementById("theme").value;
const adminRating = document.getElementById("adminRating").value;
const file = document.getElementById("image").files[0];

if(!title || !content){
alert("Fill all fields");
return;
}

if(file){

const reader = new FileReader();

reader.onloadend = function(){
saveBlog(title, content, reader.result, theme, adminRating);
};

reader.readAsDataURL(file);

}else{

saveBlog(title, content, "", theme, adminRating);

}

};


// ===============================
// SAVE REVIEW
// ===============================
async function saveBlog(title, content, imageURL, theme, adminRating){

await addDoc(collection(db,"blogs"),{
title:title,
content:content,
image:imageURL,
theme:theme,
rating:adminRating,
date:Date.now()
});

alert("Published!");

document.getElementById("title").value = "";
document.getElementById("content").value = "";
document.getElementById("image").value = "";

loadBlogs();

}


// ===============================
// DELETE REVIEW
// ===============================
window.deleteBlog = async function(i){

if(!confirm("Delete this review?")) return;

await deleteDoc(
doc(db,"blogs",window.blogDocs[i])
);

loadBlogs();

};


// ===============================
// DELETE COMMENT
// ===============================
window.deleteComment = async function(commentId){

if(!confirm("Delete this comment?")) return;

const blogId =
window.blogDocs[window.currentBlogIndex];

await deleteDoc(
doc(db,"blogs",blogId,"comments",commentId)
);

loadComments();

};


// ===============================
// RENDER BLOG CARDS
// ===============================
function renderBlogs(data){

let html = "";

data.forEach((blog,i)=>{

html += `
<div class="card">

${blog.image ? `<img src="${blog.image}" class="thumb">` : ""}

<div class="card-content">

<span class="tag">Movie Review</span>

<h3>${blog.title}</h3>

<p>${blog.content.substring(0,100)}...</p>

<div class="meta">
<span>⭐ ${blog.rating}/5</span>
<span>🎬 ${blog.theme}</span>
</div>

<button onclick="readBlog(${i})">Read Review</button>

${window.isAdmin ? `
<button onclick="deleteBlog(${i})"
style="margin-top:10px;background:#ef4444;">
Delete
</button>
` : ""}

</div>
</div>
`;

});

document.getElementById("blogs").innerHTML = html;

}


// ===============================
// LOAD HOME
// ===============================
async function loadBlogs(){

const q = query(
collection(db,"blogs"),
orderBy("date","desc")
);

const snap = await getDocs(q);

window.blogData = [];
window.blogDocs = [];

snap.forEach((d)=>{
window.blogData.push(d.data());
window.blogDocs.push(d.id);
});

renderBlogs(window.blogData);

}


// ===============================
// TOP RATED
// ===============================
window.loadTopRated = function(){

const sorted = [...window.blogData];

sorted.sort((a,b)=>
Number(b.rating) - Number(a.rating)
);

renderBlogs(sorted);

};


// ===============================
// LATEST
// ===============================
window.loadLatest = function(){

const sorted = [...window.blogData];

sorted.sort((a,b)=>
b.date - a.date
);

renderBlogs(sorted);

};


// ===============================
// OPEN REVIEW
// ===============================
window.readBlog = async function(i){

window.currentBlogIndex = i;

const blog = window.blogData[i];

document.getElementById("themeBox").className =
"box " + blog.theme;

document.getElementById("readTitle").innerText =
blog.title;

document.getElementById("readContent").innerText =
blog.content;

document.getElementById("avgRatingBox").innerHTML =
`⭐ Critic Rating: <b>${blog.rating}/5</b>`;

if(blog.image){

document.getElementById("readImage").src =
blog.image;

document.getElementById("readImage").style.display =
"block";

}else{

document.getElementById("readImage").style.display =
"none";

}

document.getElementById("viewBlog").style.display =
"flex";

loadComments();

};


// ===============================
// POST COMMENT
// ===============================
window.postComment = async function(){

const text =
document.getElementById("commentText").value.trim();

if(!text){
alert("Write comment first");
return;
}

const blogId =
window.blogDocs[window.currentBlogIndex];

await addDoc(
collection(db,"blogs",blogId,"comments"),
{
text:text,
time:Date.now()
}
);

document.getElementById("commentText").value = "";

loadComments();

};


// ===============================
// LOAD COMMENTS
// ===============================
async function loadComments(){

const blogId =
window.blogDocs[window.currentBlogIndex];

const q = query(
collection(db,"blogs",blogId,"comments"),
orderBy("time","desc")
);

const snap = await getDocs(q);

let html = "";

snap.forEach((d)=>{

const c = d.data();

html += `
<div class="comment">

<p>${c.text}</p>

${window.isAdmin ? `
<button onclick="deleteComment('${d.id}')"
style="margin-top:10px;background:#ef4444;">
Delete
</button>
` : ""}

</div>
`;

});

document.getElementById("commentsBox").innerHTML =
html || "No comments yet.";

}


// ===============================
// SHARE REVIEW
// ===============================
window.shareReview = async function(){

const blog =
window.blogData[window.currentBlogIndex];

const shareData = {
title: blog.title,
text: "Check out this movie review: " + blog.title,
url: window.location.href
};

if(navigator.share){

try{
await navigator.share(shareData);
}catch(err){}

}else{

navigator.clipboard.writeText(
window.location.href
);

alert("Link copied!");

}

};


// ===============================
// AUTO LOAD
// ===============================
loadBlogs();

window.searchBlogs = function(){

const text =
document.getElementById("searchInput")
.value
.toLowerCase();

const filtered =
window.blogData.filter(blog =>

blog.title.toLowerCase().includes(text) ||

blog.content.toLowerCase().includes(text)

);

renderBlogs(filtered);

};

window.goHome = function(){

document.getElementById("homeSection").style.display = "block";

loadBlogs();

window.scrollTo({
top:0,
behavior:"smooth"
});

};

window.showTopRated = function(){

document.getElementById("homeSection").style.display = "none";

loadTopRated();

window.scrollTo({
top:0,
behavior:"smooth"
});

};

window.showLatest = function(){

document.getElementById("homeSection").style.display = "none";

loadBlogs();

window.scrollTo({
top:0,
behavior:"smooth"
});

};
