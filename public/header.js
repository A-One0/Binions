const userIdCluster = document.querySelector(".user-id");

if (userIdCluster) {
    userIdCluster.addEventListener("click", () => {
        const accountUrl = "index.html#Account";

        if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
            window.location.hash = "#Account";
        } else {
            window.location.href = accountUrl;
        }
    });

    userIdCluster.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            userIdCluster.click();
        }
    });
}

const header = document.querySelector("header");

if (header) {
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeaderVisibility() {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        const scrollingUp = currentScrollY < lastScrollY;

        if (scrollingDown && currentScrollY > header.offsetHeight) {
            header.classList.add("header-hidden");
        } else if (scrollingUp || currentScrollY <= header.offsetHeight) {
            header.classList.remove("header-hidden");
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderVisibility);
            ticking = true;
        }
    }, { passive: true });
}
