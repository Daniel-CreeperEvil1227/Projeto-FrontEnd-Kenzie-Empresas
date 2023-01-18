import { Button } from "../scripts/navbar.js"
import { Page, Others, Modal } from "../scripts/admin.js"
import { API, Form, Utilities } from "../scripts/register.js"

Page.verifyAuthentication()
Button.addDisplayEvent()
Others.addLogoutEvent()

const baseURL = "http://localhost:6278"

class UserModal {
    static openUserEditInfoModal() {
        const editUserInfoButton = document.querySelector(".edit-user-info-icon")

        editUserInfoButton.addEventListener("click", (event) => {
            const eventId = event.target.id

            document.body.insertAdjacentHTML("beforeend", `
                <div class="background-modal">
                    <div class="edit-user-info-modal">
                        <h2>Editar Perfil</h2>
                        <button class="close-modal-button">
                            <img src="../../assets/close-icon.svg" alt="Ícone de x">
                        </button>
                        <form class="edit-user-form">
                            <input type="text" placeholder="Seu nome" required>
                            <input type="email" placeholder="Seu e-mail" required>
                            <input type="password" placeholder="Sua senha" required>
                            <button class="edit-user-info-button" disabled>Editar perfil</button>
                        </form>
                    </div>
                </div> `)

            Others.preventAllFormsDefault()
            Modal.addModalCloseEvent()
            this.addUserEditInfoEvent()
            Form.createInputsEvents("edit-user-info-button", "default")
        })

    }

    static addUserEditInfoEvent() {
        const editUserInfoButton = document.querySelector(".edit-user-info-button")
        // const userId = editUserInfoButton.id
        const form = document.querySelector(".edit-user-form")

        form.addEventListener("submit", () => {
            UserInfo.editUserInfo(editUserInfoButton)
        })
    }

}

class UserInfo {
    static async getUserInfo(endpoint) {
        const userToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })

        const options = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        }

        const responseJSON = await fetch(`${baseURL}/users/${endpoint}`, options)
        const response = await responseJSON.json()

        if (responseJSON.ok) {
            return response

        } else {
            return response.error
        }
    }

    static async renderUserInfo() {
        const userInfo = await this.getUserInfo("profile")
        const { uuid, username, email, professional_level, kind_of_work } = userInfo
        const header = document.querySelector(".user-info")
        header.innerHTML = ""

        header.insertAdjacentHTML("beforeend", `
            <div>
                <h2>${username.toUpperCase()}</h2>
                <p>Email: ${email}</p>
            </div>
            <p>${professional_level || ""}</p>
            <p>${kind_of_work || ""}</p>
            <img class="edit-user-info-icon" id="${uuid}" src="../../assets/edit-icon-active.svg" alt="Ícone de um lápis">
        `)

        UserModal.openUserEditInfoModal()
    }

    static async getUserDepartmentName() {
        const [info] = await this.getUserInfo("departments/coworkers")
        const { name, users } = info

        return { name, users }
    }

    static async renderUserCompanyAndDepartment() {
        const list = document.querySelector(".co-workers-section")
        const userWorkInfo = await this.getUserInfo("departments")

        if (userWorkInfo === "you don't belong to a department") {
            list.innerHTML = ""

            list.insertAdjacentHTML("beforeend", `
            <h2>Você ainda não foi contratado</h2> `)

        } else {
            const info = await this.getUserDepartmentName()
            const company = userWorkInfo.name
            list.innerHTML = ""
    
            list.insertAdjacentHTML("afterbegin", `
                <div>
                    <h2>${company} - ${info.name}</h2>
                </div> 
                <ul class="co-workers-list"> </ul> `)
    
            this.renderUserCoWorkers(info.users)
        }
    }

    static renderUserCoWorkers(users) {
        const userId = document.querySelector(".edit-user-info-icon").id
        const coWorkers = users.filter(element => element.uuid !== userId && !element.is_admin)
        const list = document.querySelector(".co-workers-list")

        if (coWorkers.length === 0) {
            list.insertAdjacentHTML("beforeend", `
                <h2>Nenhum(a) colega de trabalho contratado(a) ainda!</h2> `)

        } else {
            coWorkers.forEach(element => {
                list.insertAdjacentHTML("beforeend", `
                    <li>
                        <h3>${element.username}</h3>
                        <p>${element.professional_level}</p>
                    </li> `)
            })
        }
    }

    static async editUserInfo(button) {
        const userToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })
        const inputsList = [...Form.selectInputs()]
        const [username, email, password] = inputsList

        const data = {
            username: username.value,
            password: password.value,
            email: email.value
        }

        const options = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify(data)
        }

        const responseJSON = await fetch(`${baseURL}/users`, options)
        const response = await responseJSON.json()
        let statusDescription = "no-error"

        if (!responseJSON.ok) {
            try {
                statusDescription = response.error.toString()

            } catch {
                statusDescription = response.toString()
            }
        }

        if (responseJSON.ok) {
            API.showStatusToast(9)

        } else if (statusDescription === "email alread exists") {
            API.showStatusToast(10)

        } else if (statusDescription === "email is invalid") {
            API.showStatusToast(11)
        }

        Form.cleanUpInputs()
        button.setAttribute("disabled", "")
        this.renderUserInfo()
        Modal.removeModal()
    }
}

UserInfo.renderUserInfo()
UserInfo.renderUserCompanyAndDepartment()