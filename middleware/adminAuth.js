export default function adminAuth(req,res,next){

if(!req.session.user){
return res.redirect("/");
}

if(req.session.user.role !== "admin"){
return res.redirect("/student");
}

next();

}