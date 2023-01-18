import { Button } from "../scripts/navbar.js"
import { Page, Others, Department, User, Modal } from "../scripts/admin.js"

const baseURL = "http://localhost:6278"

export class Form {
	static selectInputs() {
		const inputsList = document.querySelectorAll("[required]")

		return inputsList
	}

	static createInputsEvents(buttonName, option = "default", value) {
		const button = document.querySelector(`.${buttonName}`)
		const inputsList = [...this.selectInputs()]
		const result = inputsList.find(element => element.nodeName == "SELECT")
		const oldValue = value

		inputsList.forEach(element => {
			element.addEventListener("keyup", () => {
				if (option == "default") {
					this.disableFormButtons(button, inputsList)

				} else if (option == "oldValue") {
					this.disableFormButtons(button, inputsList, oldValue)
				}

			})
		})

		if (result !== undefined) {
			inputsList.forEach(element => {
				element.addEventListener("change", () => {
					this.disableFormButtons(button, inputsList)
				})
			})
		}
	}

	static disableFormButtons(button, inputsList, oldValue = "") {
		const result = inputsList.every(element => element.value !== "" && element.value !== oldValue)

		if (result) {
			button.removeAttribute("disabled")

		} else {
			button.setAttribute("disabled", "")
		}
	}

	static addSubmitEvent(option) {
		const form = document.querySelector("form")

		form.addEventListener("submit", (event) => {
			event.preventDefault()
			API.registerOrLoginUser(option)
		})
	}

	static cleanUpInputs() {
		const inputsList = this.selectInputs()

		inputsList.forEach(element => element.value = "")
	}
}

export class API {
	static async registerOrLoginUser(requestType) {
		try {
			const inputsList = [...Form.selectInputs()]
			let [username, email, password] = inputsList

			if (requestType === "login") {
				[email, password] = inputsList
			}

			let select = {
				value: "waiting"
			}

			if (requestType === "register") {
				select = document.querySelector("select")
			}

			let data = {
				username: username.value,
				email: email.value,
				password: password.value,
				professional_level: select.value,
			}

			if (requestType === "login") {
				data = {
					email: email.value,
					password: password.value,
				}
			}

			const options = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data)
			}

			let responseJSON = "waiting"
			if (requestType === "register") {
				responseJSON = await fetch(`${baseURL}/auth/register`, options)

			} else if (requestType === "login") {
				responseJSON = await fetch(`${baseURL}/auth/login`, options)
			}

			const response = await responseJSON.json()
			let statusDescription = "no-error"
			let userToken = "waiting"

			if (!responseJSON.ok) {
				statusDescription = response.error.toString()
			}

			if (responseJSON.ok) {
				if (requestType === "register") {
					this.showStatusToast(0)

				} else if (requestType === "login") {
					this.showStatusToast(1)
					userToken = response.token.toString()
					Utilities.getAndSetFromLocalStorage({ array: userToken, key: "userToken", option: "saveArray" })
				}

			} else if (statusDescription === "email alread exists!") {
				this.showStatusToast(10)

			} else if (statusDescription === "insert a valid email!") {
				this.showStatusToast(11)

			} else if (statusDescription === "email invalid!") {
				this.showStatusToast(12)

			} else if (statusDescription === "password invalid!") {
				this.showStatusToast(13)

			} else {
				if (requestType === "register") {
					this.showStatusToast(14)

				} else if (requestType === "login") {
					this.showStatusToast(15)
				}
			}


			Form.cleanUpInputs()
			const button = document.querySelector(".register-button") || document.querySelector(".login-button")
			button.setAttribute("disabled", "")

			select.value = ""

			if (responseJSON.ok) {
				if (requestType === "register") {
					setTimeout(() => window.location.assign("../login/index.html"), 5000)

				} else if (requestType === "login") {
					const result = await this.validateUser()

					result
						? setTimeout(() => window.location.assign("../adminDashboard/index.html"), 5000)
						: setTimeout(() => window.location.assign("../userDashboard/index.html"), 5000)
				}
			}

		} catch (error) {
			console.log()
		}
	}

	static async validateUser() {
		try {
			const userToken = Utilities.getAndSetFromLocalStorage({ key: "userToken", option: "useArray" })
			const options = {
				method: "GET",
				headers: {
					Authorization: `Bearer ${userToken}`,
				}
			}

			const responseJSON = await fetch(`${baseURL}/auth/validate_user`, options)
			const response = await responseJSON.json()
			let result = response.is_admin
			
			if (response.erro === "Token Invalid") {
				result = "no-token"
			}
			
			return result

		} catch {
			const result = "no-token"
			return result
		}
	}

	static showStatusToast(index, option) {
		const messages = [
			"Criação de usuário bem sucedida!",
			"Login efetuado com sucesso!",
			"Departamento criado com sucesso!",
			"Departamento editado com sucesso!",
			"Departamento deletado com sucesso!",
			"Usuário(a) contratado(a) com sucesso!",
			"Usuário(a) demitido(a) com sucesso!",
			"Usuário(a) editado(a) com sucesso!",
			"Usuário(a) deletado(a) com sucesso!",
			"Informações do(a) Usuário(a) editados(as) com sucesso!",
			"Email já cadastrado!",
			"Insira um email válido!",
			"Email incorreto!",
			"Senha incorreta!",
			"Não foi possível criar o usuário!",
			"Não foi possível efetuar o login!"
		]

		let toast = document.querySelector(".message-toast")
		if (toast) {
			toast.remove()
		}

		if (option === "modal") {
			const modal = document.querySelector(".background-modal")
			modal.insertAdjacentHTML("beforeend", `
				<div class="message-toast">
					<h3>${messages[index]}</h3>
				</div> `)

		} else {
			const main = document.querySelector("main")
			main.insertAdjacentHTML("beforeend", `
				<div class="message-toast">
					<h3>${messages[index]}</h3>
				</div> `)
		}

		toast = document.querySelector(".message-toast")

		index > 9
			? toast.style.backgroundColor = "var(--alert100)"
			: toast.style.backgroundColor = "var(--sucess100)"

		if (index === 2 || index === 3 || index === 4) {
			toast.style.bottom = "55%"

		} else if (index === 7 || index === 8) {
			toast.style.bottom = "45%"

		} else if (index === 9) {
			toast.style.bottom = "35%"
		}

		setTimeout(() => toast.remove(), 5000)
	}
}

export class Utilities {
	static verifyWindowLocation(option, alternate) {
		const currentLocation = location.pathname
		const path = `/${option}/index.html`
		let result = currentLocation.indexOf(path)

		if (option === "register" && result !== -1) {
			Form.createInputsEvents("register-button")
			Form.addSubmitEvent("register")
			Button.addDisplayEvent()
		}
	}

	static getAndSetFromLocalStorage(data) {
		if (data.option === "saveArray") {
			const arrayInJSON = JSON.stringify(data.array)
			localStorage.setItem(data.key, arrayInJSON)

		} else if (data.option === "useArray") {
			const arrayInJSON = localStorage.getItem(data.key)
			const arrayInJS = JSON.parse(arrayInJSON)
			return arrayInJS
		}
	}
}

Utilities.verifyWindowLocation("register")