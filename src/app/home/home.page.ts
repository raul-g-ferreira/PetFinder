import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { PetCardModalComponent } from '../components/pet-card-modal/pet-card-modal.component';
import { PetCard } from '../models/pet-card.model';
import { DatabaseService } from './../services/database.service';
import { PetType } from '../models/enums/pet-type';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit{

  petCards: PetCard[] = [
    // {
    //   id: '1',
    //   description: 'Cachorro perdido encontrado na rua.',
    //   type: 'Cachorro',
    //   photoUrl: 'https://picsum.photos/500/300',
    //   latitude: -23.55052,
    //   longitude: -46.633308,
    //   contact: '(11) 99999-9999',
    //   timestamp: new Date()
    // },
    // {
    //   id: '2',
    //   description: 'Gato encontrado no parque.',
    //   type: 'Gato',
    //   photoUrl: 'https://picsum.photos/502/300',
    //   latitude: -23.55052,
    //   longitude: -46.633308,
    //   contact: '(11) 99999-9999',
    //   timestamp: new Date()
    // },
    // {
    //   id: '3',
    //   description: 'Pássaro encontrado na praça.',
    //   type: 'Passaro',
    //   photoUrl: 'https://picsum.photos/501/300',
    //   latitude: -23.55052,
    //   longitude: -46.633308,
    //   contact: '(11) 99999-9999',
    //   timestamp: new Date()
    // }
  ]
  filteredPetCards: PetCard[] = []
  searchTerm: string = ''
  selectedType: PetType | null = null
  isLoading: boolean = false

  petTypes = Object.values(PetType)

  constructor(
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private databaseService: DatabaseService,
    private alertController: AlertController
  ) {
  }

  ngOnInit(): void {
    this.selectedType = null

    this.databaseService.isDbReady.subscribe(async (estaPronto) => {
      if (estaPronto) {
        await this.loadPetCards();
      }
    });
  }

  async loadPetCards() {
    try {
      this.petCards = await this.databaseService.obterCards()
      this.applyFilters()
    } catch (error) {
      console.error('Erro ao carregar pets:', error);
      this.showErrorAlert('Erro ao carregar pets. Tente novamente mais tarde.')
    } finally {
      this.isLoading = false
    }
  }

  applyFilters() {
    let filtered = [...this.petCards]

    if (this.selectedType) {
      filtered = filtered.filter(pet => pet.type === this.selectedType)
    }

    if (this.searchTerm) {
      filtered = filtered.filter(pet =>
        pet.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pet.contact.toLowerCase().includes(this.searchTerm.toLowerCase()))
    }
    this.filteredPetCards = filtered
  }

  onTypeFilterChange(type: any) {
    this.selectedType = type
    this.applyFilters()
  }

  clearFilters() {
    this.searchTerm = ''
    this.selectedType = null
    this.applyFilters()
  }

  async addCard() {
    const modal = await this.modalController.create({
      component: PetCardModalComponent
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<PetCard>()

    if (role === 'confirm' && data) {
      await this.databaseService.adicionarCard(data)
      this.loadPetCards()
    }
  }

  async abrirOpcoes(pet: PetCard) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opções',
      buttons: [
        {
          text: 'Copiar contato',
          icon: 'call-outline',
          handler: () => {
            this.copyToClipboard(pet.contact)
          }
        },
        // {
        //   text: 'Copiar coordenadas',
        //   icon: 'location-outline',
        //   handler: () => {
        //     this.copyToClipboard(`${pet.latitude} ${pet.longitude}`)
        //     console.log('copiando coordenadas:', pet.latitude, pet.longitude);
        //   }
        // },
        {
          text: 'Abrir no mapa',
          icon: 'map-outline',
          handler: () => {
            const url = `https://www.google.com/maps/search/?api=1&query=${pet.latitude},${pet.longitude}`
            window.open(url, '_system')
          }
        },
        {
          text: 'Excluir',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            this.excluirCard(pet.id)
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    })

    await actionSheet.present()
  }

  async copyToClipboard(text: string) {
    await Clipboard.write({string: text})
  }

  async excluirCard(id: string) {
    await this.databaseService.deletarCard(id)
    this.loadPetCards()
  }

  async handleRefresh(event: any) {
    await this.loadPetCards()
    event.target.complete()
  }

  private showErrorAlert(message: string) {
    this.alertController.create({
      header: 'Erro',
      message: message,
      buttons: ['OK']
    }).then(alert => alert.present());
  }
}
