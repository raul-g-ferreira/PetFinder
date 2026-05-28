import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { ModalController } from '@ionic/angular';
import { PetType } from 'src/app/models/enums/pet-type';
import { PetCard } from './../../models/pet-card.model';


@Component({
  selector: 'app-pet-card-modal',
  templateUrl: './pet-card-modal.component.html',
  styleUrls: ['./pet-card-modal.component.scss'],
  standalone: false
})
export class PetCardModalComponent implements OnInit {

  formPetCard!: FormGroup
  card: PetCard = {} as PetCard
  hasPhoto: boolean = false
  position: Position | null = null

  isGettingLocation: boolean = false
  isTakingPhoto: boolean = false
  locationError: string | null = null
  photoError: string | null = null

  public petTypes = Object.values(PetType)

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {
    this.formPetCard = this.fb.group({
      description: ['', []],
      type: ['', [Validators.required]],
      contact: ['', [Validators.required, Validators.pattern(/^[\d\s\-\(\)]+$/)]]
    })

    try {
      this.isGettingLocation = true
      this.locationError = null

      const status = await Geolocation.checkPermissions()
      if (status.location !== 'granted') {
        const request = await Geolocation.requestPermissions()
        if (request.location !== 'granted') {
          throw new Error('Permissão de localização não concedida');
        }
      }

      this.position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    } catch (error: any) {
      console.error('Erro ao obter localização', error)
      this.locationError = error.message || 'Não foi possível obter a localização.'
      this.position = null
    } finally {
      this.isGettingLocation = false
    }
  }

  cancel() {
    return this.modalController.dismiss(null, 'cancel')
  }

  confirm() {
    this.formPetCard.markAllAsTouched()

    if (this.formPetCard.valid) {
      const formValues = this.formPetCard.value
      const newCard: PetCard = {
        id: new Date().getTime().toString(),
        description: formValues.description,
        type: formValues.type,
        photoUrl: this.card.photoUrl,
        latitude: this.position?.coords.latitude || 0,
        longitude: this.position?.coords.longitude || 0,
        contact: formValues.contact,
        timestamp: new Date()
      }
      this.formPetCard.reset()

      return this.modalController.dismiss(newCard, 'confirm')
    }
    return
  }

  async onTakePhoto() {
    try {
      this.isTakingPhoto = true
      this.photoError = null

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      })

      if (photo.base64String) {
        this.card.photoUrl = `data:image/jpeg;base64,${photo.base64String}`
        this.hasPhoto = true
      } else if (photo.webPath) { // quando cai pra webpath?
        this.card.photoUrl = photo.webPath
        this.hasPhoto = true
      }

    } catch (err: any) {
      console.error('Erro ao tirar foto', err)
      this.photoError = err.message || 'Não foi possível tirar a foto.'
    } finally {
      this.isTakingPhoto = false
    }
  }

  removePhoto() {
    this.card.photoUrl = ''
    this.hasPhoto = false
  }
}
