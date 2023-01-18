import { Button } from "../scripts/navbar.js"
import { Form, Utilities, API } from "../scripts/register.js"

const baseURL = "http://localhost:6278"

export class Department {
    static async renderDepartments(endpoint) {
        const list = document.querySelector(".department-list")
        list.innerHTML = ""
        const array = await this.getAllDepartmentsAndCompanies(endpoint)

        if (array.length === 0) {
            list.insertAdjacentHTML("beforeend", `
                <div class="empty-display">
                    <h3>Nenhum departamento cadastrado ainda!</h3>
                    <p>Que tal criar um?</p>
                </div> `)

        } else {
            array.forEach(element => {
                list.insertAdjacentHTML("beforeend", `
                <li>
                    <div>
                        <h3>${element.name}</h3>
                        <p>${element.description}</p>
                        <p>${element.companies.name}</p>
                    </div>
                    <div>
                        <img class="view-department-icon" id="${element.uuid}" src="../../assets/view-icon.svg" alt="Ícone de olho">
                        <img class="edit-department-icon" id="${element.uuid}" src="../../assets/edit-icon.svg" alt="Ícone de lápis">
                        <img class="delete-department-icon" id="${element.uuid}" src="../../assets/delete-icon.svg" alt="Ícone de lixeira">
                    </div>
                </li> `)
            })

            Modal.openDepartmentEditModal(array)
            Modal.openDepartmentDeleteModal(array)
            Modal.openDepartmentViewModal(array)
        }
    }

    static async getAllDepartmentsAndCompanies(endpoint) {
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })

        const options = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${adminToken}`,
            }
        }

        const responseJSON = await fetch(`${baseURL}/${endpoint}`, options)
        const response = await responseJSON.json()

        return response
    }

    static async renderSelectOptions(selectClass, endpoint, firstValue) {
        const select = document.querySelector(`.${selectClass}`)
        const array = await this.getAllDepartmentsAndCompanies(endpoint)
        select.innerHTML = ""
        select.insertAdjacentHTML("beforeend", firstValue)

        array.forEach(element => {
            select.insertAdjacentHTML("beforeend", `
                <option value="${element.uuid}">${element.name || element.username}</option>
            `)
        })
    }

    static addSelectEvent() {
        const select = document.querySelector(".select-companies")

        select.addEventListener("change", () => {
            const company = select.value
            const endpoint = `departments/${company}`
            this.renderDepartments(endpoint)
        })
    }

    static async createAndEditDepartment(button, requestType) {
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })
        const inputsList = [...Form.selectInputs()]
        let department = "waiting"
        let responseJSON = "waiting"
        let response = "waiting"

        if (requestType === "create") {
            const [name, description, company] = inputsList

            const data = {
                name: name.value,
                description: description.value,
                company_uuid: company.value,
            }

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(data)
            }

            responseJSON = await fetch(`${baseURL}/departments`, options)

            if (responseJSON.ok) {
                API.showStatusToast(2, "main")
            }

        } else if (requestType === "edit") {
            const [description] = inputsList
            department = button.id

            const data = {
                description: description.value,
            }

            const options = {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(data)
            }

            responseJSON = await fetch(`${baseURL}/departments/${department}`, options)

            if (responseJSON.ok) {
                API.showStatusToast(3, "main")
            }
        }

        const select = document.querySelector(".select-companies")
        const company = select.value
        const endpoint = `departments/${company}`

        Form.cleanUpInputs()
        button.setAttribute("disabled", "")
        Department.renderDepartments(endpoint)
        Modal.removeModal()
    }

    static async deleteDepartmentAndUser(id) {
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })
        const departmentAndUser = id

        const options = {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        }

        const select = document.querySelector(".select-companies")
        const company = select.value
        const endpoint = `departments/${company}`
        const responseJSON = await fetch(`${baseURL}/departments/${departmentAndUser}`, options)

        if (responseJSON.ok) {
            API.showStatusToast(4, "main")
        }

        Department.renderDepartments(endpoint)
        Modal.removeModal()
    }

    static async hireUserToDepartment(departmentId, userId, button, company) {
        const array = await this.getAllDepartmentsAndCompanies("departments")
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })

        const data = {
            user_uuid: userId,
            department_uuid: departmentId,
        }

        const options = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(data)
        }

        const responseJSON = await fetch(`${baseURL}/departments/hire/`, options)

        if (responseJSON.ok) {
            API.showStatusToast(5, "modal")
        }

        Form.cleanUpInputs()
        button.setAttribute("disabled", "")
        Department.renderSelectOptions("select-department-users", "admin/out_of_work", `<option value="">Selecionar usuário</option>`)
        this.renderHiredUsers(departmentId, company, userId)
        User.renderUsers(array)
    }

    static async renderHiredUsers(id, company, userId) {
        const list = document.querySelector(".hired-users-list")
        const users = await this.getAllDepartmentsAndCompanies("users")
        const hiredUsers = users.filter(element => element.department_uuid === id)
        list.innerHTML = ""

        if (hiredUsers.length === 0) {
            list.insertAdjacentHTML("beforeend", `
            <div class="empty-display">
                <h3>Nenhum usuário(a) contratado(a) ainda!</h3>
                <p>Que tal contratar um(a)?</p>
            </div> `)

        } else {
            hiredUsers.forEach(element => {
                let option = ""
                if (element.uuid === userId) {
                    option = "afterbegin"

                } else {
                    option = "beforeend"
                }

                list.insertAdjacentHTML(option, `
                <li>
                    <div>
                        <h3>${element.username}</h3>
                        <p>${element.professional_level}</p>
                        <p>${company}</p>
                    </div>
                    <button class="dismiss-user-button" id="${element.uuid}">Desligar</button>
                </li> `)
            })

            Modal.addDismissUserEvent(id, company)
        }
    }

    static async dismissUser(userId, company, departmentId) {
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })

        const options = {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        }

        const responseJSON = await fetch(`${baseURL}/departments/dismiss/${userId}`, options)

        if (responseJSON.ok) {
            API.showStatusToast(6, "modal")
        }

        const departmentList = await this.getAllDepartmentsAndCompanies("departments")
        this.renderSelectOptions("select-department-users", "admin/out_of_work", `<option value="">Selecionar usuário</option>`)
        this.renderHiredUsers(departmentId, company)
        User.renderUsers(departmentList)
    }
}

export class Modal {
    static removeModal() {
        const modalBackground = document.querySelector(".background-modal")
        const modal = modalBackground.children[0]
        modal.style.animation = "modalDisappear 1.5s ease"
        setTimeout(() => modalBackground.remove(), 600)
    }

    static addModalCloseEvent() {
        const closeButton = document.querySelector(".close-modal-button")

        closeButton.addEventListener("click", () => {
            this.removeModal()
        })
    }

    static openDepartmentCreateModal() {
        const createButton = document.querySelector(".create-departments-button")

        createButton.addEventListener("click", () => {
            document.body.insertAdjacentHTML("beforeend", `
                <div class="background-modal">
                    <div class="create-department-modal">
                        <h2>Criar Departamento</h2>
                        <button class="close-modal-button">
                            <img src="../../assets/close-icon.svg" alt="Ícone de x">
                        </button>
                        <form>
                            <input type="text" placeholder="Nome do departamento" required>
                            <input type="text" placeholder="Descrição" required>
                            <div class="select-div">
                                <select class="select-companies-modal" required>
                                    <option value="">Selecionar empresa</option>
                                </select>
                            </div>
                            <button class="create-department-button" disabled>Criar o departamento</button>
                        </form>
                    </div>
                </div> `)

            Others.preventAllFormsDefault()
            this.addModalCloseEvent()
            Department.renderSelectOptions("select-companies-modal", "companies", `<option value="">Selecionar empresa</option>`)
            Form.createInputsEvents("create-department-button")
            this.addCreateDepartmentEvent()
        })
    }

    static addCreateDepartmentEvent() {
        const createButton = document.querySelector(".create-department-button")

        createButton.addEventListener("click", () => {
            Department.createAndEditDepartment(createButton, "create")
        })
    }

    static findDepartmentDescriptionAndName(array, id) {
        const data = array.map(element => {
            return { id: element.uuid, description: element.description, name: element.name, company: element.companies.name }
        })

        const elements = data.filter(element => element.id === id)
        return elements
    }

    static openDepartmentEditModal(array) {
        const editButtons = [...document.querySelectorAll(".edit-department-icon")]

        editButtons.forEach(element => {
            element.addEventListener("click", (event) => {
                const eventId = event.target.id
                const [data] = this.findDepartmentDescriptionAndName(array, eventId)

                document.body.insertAdjacentHTML("beforeend", `
                    <div class="background-modal">
                        <div class="edit-department-modal">
                            <h2>Editar Departamento</h2>
                            <button class="close-modal-button">
                                <img src="../../assets/close-icon.svg" alt="Ícone de x">
                            </button>
                            <form>
                                <textarea cols="40" rows="5" placeholder="Sua descrição aqui" required>${data.description}</textarea>
                                <button class="edit-department-button" id="${data.id}" disabled>Salvar alterações</button>
                            </form>
                        </div>
                    </div> `)

                Others.preventAllFormsDefault()
                this.addModalCloseEvent()
                Form.createInputsEvents("edit-department-button", "oldValue", data.description)
                this.addEditDepartmentEvent()
            })
        })
    }

    static addEditDepartmentEvent() {
        const editButton = document.querySelector(".edit-department-button")

        editButton.addEventListener("click", () => {
            Department.createAndEditDepartment(editButton, "edit")
        })
    }

    static openDepartmentDeleteModal(array) {
        const deleteButtons = [...document.querySelectorAll(".delete-department-icon")]

        deleteButtons.forEach(element => {
            element.addEventListener("click", (event) => {
                const eventId = event.target.id
                const [data] = this.findDepartmentDescriptionAndName(array, eventId)

                document.body.insertAdjacentHTML("beforeend", `
                    <div class="background-modal">
                        <div class="delete-department-modal">
                            <h2>Realmente deseja deletar o\n
                                Departamento: ${data.name}\n
                                e demitir seus funcionários?</h2>
                            <button class="close-modal-button">
                                <img src="../../assets/close-icon.svg" alt="Ícone de x">
                            </button>
                            <form>
                                <button class="delete-department-button" id="${data.id}">Confirmar</button>
                            </form>
                        </div> 
                    </div> `)

                Others.preventAllFormsDefault()
                this.addDeleteDepartmentEvent()
                this.addModalCloseEvent()
            })
        })
    }

    static addDeleteDepartmentEvent() {
        const deleteButton = document.querySelector(".delete-department-button")

        deleteButton.addEventListener("click", () => {
            Department.deleteDepartmentAndUser(deleteButton.id)
        })
    }

    static openDepartmentViewModal(array) {
        const viewButtons = [...document.querySelectorAll(".view-department-icon")]

        viewButtons.forEach(element => {
            element.addEventListener("click", (event) => {
                const eventId = event.target.id
                const [data] = this.findDepartmentDescriptionAndName(array, eventId)

                document.body.insertAdjacentHTML("beforeend", `
                    <div class="background-modal">
                        <div class="view-department-modal">
                            <h2>${data.name}</h2>
                            <button class="close-modal-button">
                                <img src="../../assets/close-icon.svg" alt="Ícone de x">
                            </button>
                            <div>
                                <div>
                                    <h3>${data.description}</h3>
                                    <p>${data.company}</p>
                                </div>
                                <div>
                                    <form>
                                        <div class="select-div">
                                            <select class="select-department-users" required>
                                                <option value="">Selecionar usuário</option>
                                            </select>
                                        </div>
                                        <button class="hire-user-button" id="${data.id}" disabled>Contratar</button>
                                    </form>
                                </div>
                            </div>
                            <ul class="hired-users-list"></ul>
                        </div>
                    </div> `)

                Others.preventAllFormsDefault()
                this.addModalCloseEvent()
                Department.renderSelectOptions("select-department-users", "admin/out_of_work", `<option value="">Selecionar usuário</option>`)
                Department.renderHiredUsers(data.id, data.company)
                Form.createInputsEvents("hire-user-button")
                this.addHireUserEvent(data.company)
            })
        })
    }

    static addHireUserEvent(company) {
        const hireButton = document.querySelector(".hire-user-button")
        const userSelect = document.querySelector(".select-department-users")

        hireButton.addEventListener("click", () => {
            const departmentId = hireButton.id
            const userId = userSelect.value
            Department.hireUserToDepartment(departmentId, userId, hireButton, company)
        })
    }

    static addDismissUserEvent(departmentId, company) {
        const dismissButtons = document.querySelectorAll(".dismiss-user-button")

        dismissButtons.forEach(element => {
            element.addEventListener("click", () => {
                const userId = element.id
                Department.dismissUser(userId, company, departmentId)
            })
        })
    }

    static openUserEditModal() {
        const editUserButtons = document.querySelectorAll(".edit-user-icon")

        editUserButtons.forEach(element => {
            element.addEventListener("click", (event) => {
                const eventId = event.target.id

                document.body.insertAdjacentHTML("beforeend", `
                <div class="background-modal">
                    <div class="edit-user-modal">
                        <h2>Editar Usuário</h2>
                        <button class="close-modal-button">
                            <img src="../../assets/close-icon.svg" alt="Ícone de x">
                        </button>
                        <form>
                            <div class="select-div">
                                <select required>
                                    <option value="">Selecionar modalidade de trabalho</option>
                                    <option value="home office">Home Office</option>
                                    <option value="presencial">Presencial</option>
                                    <option value="híbrido">Híbrido</option>
                                </select>
                            </div>
                            <div class="select-div">
                                <select required>
                                    <option value="">Selecionar nível profissional</option>
                                    <option value="estágio">Estágio</option>
                                    <option value="júnior">Júnior</option>
                                    <option value="pleno">Pleno</option>
                                    <option value="sênior">Sênior</option>
                                </select>
                            </div>
                            <button class="edit-user-button" id="${eventId}" disabled>Editar</button>
                        </form>
                    </div>
                </div> `)

                Others.preventAllFormsDefault()
                this.addModalCloseEvent()
                this.addEditUserEvent()
                Form.createInputsEvents("edit-user-button")
            })
        })
    }

    static addEditUserEvent() {
        const editUserButton = document.querySelector(".edit-user-button")
        const userId = editUserButton.id

        editUserButton.addEventListener("click", () => {
            User.editUser(userId, editUserButton)
        })
    }

    static openUserDeleteModal() {
        const deleteUserButtons = document.querySelectorAll(".delete-user-icon")

        deleteUserButtons.forEach(element => {
            element.addEventListener("click", (event) => {
                const eventId = event.target.id
                const elements = event.composedPath()[2].children
                const userName = elements[0].children[0].innerText

                document.body.insertAdjacentHTML("beforeend", `
                    <div class="background-modal">
                        <div class="delete-user-modal">
                            <h2>Realmente deseja remover o\n
                                usuário: ${userName}?</h2>
                            <button class="close-modal-button">
                                <img src="../../assets/close-icon.svg" alt="Ícone de x">
                            </button>
                            <form>
                                <button class="delete-user-button" id="${eventId}">Deletar</button>
                            </form>
                        </div>
                    </div> `)

                Others.preventAllFormsDefault()
                this.addModalCloseEvent()
                this.addDeleteUserEvent()
            })
        })
    }

    static addDeleteUserEvent() {
        const deleteUserButton = document.querySelector(".delete-user-button")
        const userId = deleteUserButton.id

        deleteUserButton.addEventListener("click", () => {
            User.deleteUser(userId, deleteUserButton)
        })
    }
}

export class Others {
    static preventAllFormsDefault() {
        const forms = document.querySelectorAll("form")

        forms.forEach(element => {
            element.addEventListener("submit", (event) => {
                event.preventDefault()
            })
        })
    }

    static addLogoutEvent() {
        const logoutButton = document.querySelector(".logout-button")

        logoutButton.addEventListener("click", () => {
            localStorage.clear()
            setTimeout(() => window.location.assign("../../../index.html"), 1200)
        })
    }
}

export class User {
    static async renderUsers(array) {
        const list = document.querySelector(".user-list")
        const usersList = await Department.getAllDepartmentsAndCompanies("users")
        const noAdminUsers = usersList.filter(element => !element.is_admin)
        let departmentName = "waiting"
        list.innerHTML = ""

        if (noAdminUsers.length === 0) {
            list.insertAdjacentHTML("beforeend", `
            <div class="empty-display">
                <h3>Nenhum usuário(a) cadastrado(a) ainda!</h3>
                <p>Que tal convidar um(a) amigo(a)?</p>
            </div> `)

        } else {
            if (array.length === 0) {
                array = await Department.getAllDepartmentsAndCompanies("departments")
            }

            noAdminUsers.forEach(element => {
                const [department] = array.filter(department => department.uuid === element.department_uuid)
                try {
                    departmentName = department.name

                } catch {
                    departmentName = "Desempregado"
                }

                list.insertAdjacentHTML("beforeend", `
                <li>
                    <div>
                        <h3>${element.username}</h3>
                        <p>${element.professional_level || "Não informado"}</p>
                        <p>${departmentName}</p>
                    </div>
                    <div>
                        <img class="edit-user-icon" id="${element.uuid}" src="../../assets/edit-icon-active.svg" alt="Ícone de lápis">
                        <img class="delete-user-icon" id="${element.uuid}" src="../../assets/delete-icon.svg" alt="Ícone de lixeira">
                    </div>
                </li> `)
            })

            Modal.openUserEditModal()
            Modal.openUserDeleteModal()
        }
    }

    static async editUser(userId, button) {
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })
        const inputsList = [...Form.selectInputs()]
        const [work, profissional] = inputsList

        const data = {
            kind_of_work: work.value,
            professional_level: profissional.value,
        }

        const options = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(data)
        }

        const responseJSON = await fetch(`${baseURL}/admin/update_user/${userId}`, options)

        if (responseJSON.ok) {
            API.showStatusToast(7, "main")
        }

        const departmentList = await Department.getAllDepartmentsAndCompanies("departments")
        Form.cleanUpInputs()
        button.setAttribute("disabled", "")
        Modal.removeModal()
        this.renderUsers(departmentList)
    }

    static async deleteUser(userId, button) {
        const adminToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })

        const options = {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        }

        const responseJSON = await fetch(`${baseURL}/admin/delete_user/${userId}`, options)

        if (responseJSON.ok) {
            API.showStatusToast(8, "main")
        }

        const departmentList = await Department.getAllDepartmentsAndCompanies("departments")
        Form.cleanUpInputs()
        button.setAttribute("disabled", "")
        Modal.removeModal()
        this.renderUsers(departmentList)
    }
}

export class Page {
    static async verifyAuthentication() {
        const isAdminPage = Register.verifyWindowLocation("adminDashboard")
        const isUserPage = Register.verifyWindowLocation("userDashboard")
        const verifyAdmin = await API.validateUser()

        if (verifyAdmin === "no-token") {
            localStorage.clear()
            window.location.replace("../../../index.html")

        } else if (isAdminPage && !verifyAdmin) {
            localStorage.clear()
            window.location.replace("../../../index.html")

        } else if (isUserPage && verifyAdmin) {
            localStorage.clear()
            window.location.replace("../../../index.html")
        }
    }
}

class Register {
    static verifyWindowLocation(option, alternate) {
        const currentLocation = location.pathname
        const path = `/${option}/index.html`
        let result = currentLocation.indexOf(path)

        if (alternate === "adminPage" && result !== -1) {
            Button.addDisplayEvent()
            Page.verifyAuthentication()
            Others.addLogoutEvent()
            Department.renderDepartments("departments")
            User.renderUsers([])
            Department.renderSelectOptions("select-companies", "companies", `<option value="">Selecionar Empresa</option>`)
            Department.addSelectEvent()
            Modal.openDepartmentCreateModal()

        } else if (option === "adminDashboard" || option === "userDashboard") {
            result === -1
                ? result = false
                : result = true

            return result
        }
    }
}

Register.verifyWindowLocation("adminDashboard", "adminPage")