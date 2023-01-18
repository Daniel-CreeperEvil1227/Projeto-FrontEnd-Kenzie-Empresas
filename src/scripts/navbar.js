export class Button {
    static addDisplayEvent() {
        const icon = document.querySelector("[data-dropdown-button]")
        const menu = document.querySelector("[data-dropdown-menu]")
        
        icon.addEventListener("click", () => {
            const iconValue = icon.getAttribute("data-dropdown-button")
            const menuValue = menu.getAttribute("data-dropdown-menu")

            iconValue == "show-menu"
                ? icon.setAttribute("data-dropdown-button", "close-menu")
                : icon.setAttribute("data-dropdown-button", "show-menu")

            menuValue == "hidden-menu"
                ? menu.setAttribute("data-dropdown-menu", "showing-menu")
                : menu.setAttribute("data-dropdown-menu", "hidden-menu")
        })
    }
}