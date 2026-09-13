window.addEventListener("scroll",function(){

const header=document.querySelector("header");

if(window.scrollY>50){
    header.style.boxShadow="0 5px 20px rgba(0,0,0,.15)";
}else{
    header.style.boxShadow="0 3px 15px rgba(0,0,0,.08)";
}

});

document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("homeMenuToggle");
    const navigation = document.getElementById("homeNavigation");

    if (!toggle || !navigation) return;

    const closeMenu = function () {
        navigation.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector("i").className = "fa-solid fa-bars";
    };

    toggle.addEventListener("click", function () {
        const isOpen = navigation.classList.toggle("active");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.querySelector("i").className = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    });

    navigation.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".navbar")) closeMenu();
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 900) closeMenu();
    });
});
