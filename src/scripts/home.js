import { Button } from "../scripts/navbar.js"
Button.addDisplayEvent()

const baseURL = "http://localhost:6278"

class List {
    static renderSectorsList(array) {
        const list = document.querySelector(".sector-list")
        list.innerHTML = ""

        array.forEach(element => {
            list.insertAdjacentHTML("beforeend", `
                <li>
                    <h2>${element.name}</h2>
                    <div>
                        <p>Horário de Abertura: ${element.opening_hours} horas</p>
                        <h3>${element.sectors.description}</h3>
                    </div>
                </li> `)
        })
    }

    static async getCompaniesListFromAPI(endpoint) {
        try {
            const options = {
                method: "GET"
            }

            const responseJSON = await fetch(`${baseURL}/${endpoint}`, options)
            const response = await responseJSON.json()
            this.renderSectorsList(response)

        } catch (error) {
            console.log(error)
        }
    }

    static async createSectorsList() {
        try {
            const responseJSON = await fetch(`${baseURL}/sectors`, {method: "GET"})
            const response = await responseJSON.json()
            return response

        } catch (error) {
            console.log(error)
        }
    }

    static async createSelectOptions() {
        const list = await this.createSectorsList()
        const select = document.querySelector(".select-sector")

        list.forEach(element => {
            select.insertAdjacentHTML("beforeend", `
                <option value="${element.description}">${element.description}</option>
            `)
        })

        this.addSelectEvent(select)
    }

    static addSelectEvent(select) {
        select.addEventListener("change", () => {
            const sector = select.value
            this.getCompaniesListFromAPI(`companies/${sector}`)
        })
    }
}

List.getCompaniesListFromAPI("companies")
List.createSelectOptions()