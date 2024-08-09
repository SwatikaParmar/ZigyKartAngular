import { Component, NgZone, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ContentService } from 'src/app/Shared/service/content.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { DatePipe, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-inventory-edit',
  templateUrl: './product-inventory-edit.component.html',
  styleUrls: ['./product-inventory-edit.component.css'],
  providers: [DatePipe],
})
export class ProductInventoryEditComponent implements OnInit {
  isFieldDisabled = true;
  // vendorId = localStorage.getItem('vendorId');
  containerList: any;
  brandList: any;
  qunatityList: any;
  form!: FormGroup;
  datePickerConfig: Partial<BsDatepickerConfig>;
  today: Date = new Date();
  submitted = false;
  // groupId = 0;
  maincategoryList: any;
  SubcategoryList: any;
  SubSubcategoryList!: any;

  // image

  urls: any[] = [];
  imageFile!: { link: any; file: any; name: any; type: any };
  imageFiles!: File[];
  productId: any;
  shopId: any;
  vendorDetail: any;
  shopDetail: any;
  subId: any;
  mainId: any;
  rootUrl!: string;

  editImages!: string;
  urls1!: any;
  _handleReaderLoaded: any;
  selectedImageData: any[] = [];
  concatImage: any;
  base64Image: any = [];
  productDetail: any;
  InventoryStatus = 'true';

  // calculate percentage
  mrp: any;
  discount: any;
  sellingPrice: any;
  discountType: string = '1';
  maxDiscountValue: any;
  discountValue!: number;
  errorMessage: any;
  // date
  manuDate: any;
  exiDate: any;
  dateValue!: Date;
  dateValues!: Date;
  constructor(
    private toaster: ToastrService,
    private spinner: NgxSpinnerService,
    private content: ContentService,
    private router: Router,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private _location: Location,
    public datepipe: DatePipe,
    private http: HttpClient
  ) {
    this.datePickerConfig = Object.assign(
      {},
      {
        minDate: new Date(), // sets the minimum date to the current date
      }
    );
  }

  ngOnInit(): void {
    this.rootUrl = environment.rootPathUrl;
    this.productId = this.route.snapshot.paramMap.get('id');
    // this.getvendorDetail();
    this.getContainerListType();
    this.getbrandList();
    this.getQuantity();
    this.getcategoryList();
    this.ProductForm();
    this.getProductDetail();
  }

  ProductForm() {
    this.form = this.formBuilder.group({
      sellingPrice: ['', [Validators.required]],
      discount: [0],
      discountType: [0],
      mrp: ['', [Validators.required]],
      manufacturingDate: [''],
      expiryDate: [''],
      quantity: ['', [Validators.required]],
      productQuantityTypeId: ['', [Validators.required]],
      productContainerTypeId: [null],
      productName: ['', [Validators.required]],
      skuid: ['', [Validators.required]],
      productDescription: [null],
      brandId: [null],
      mainProductCategoryId: ['', [Validators.required]],
      subProductCategoryId: [null],
      subSubProductCategoryId: [null],
      groupId: [0],
      waitingDays: [null],
      speciality: [0],
      flavour: [null],
      howToUse: [null],
      ingredients: [null],
      storageAndUses: [null],
      nutritionFact: [null],
      otherProductInfo: [null],
      productId: [this.productId],
      ProductImage: [],
    });
  }

  get f() {
    return this.form['controls'];
  }

  backClicked() {
    this._location.back();
  }

  getContainerListType() {
    this.content.getContainerList().subscribe((response) => {
      if (response.isSuccess) {
        this.containerList = response.data;
      }
    });
  }

  calculateSellingPrice() {
    const mrp = parseFloat(this.mrp);
    let discount = parseFloat(this.discount);
    let errorMessage = '';

    if (this.discountType === '0') {
      if (isNaN(discount)) {
        discount = 0;
      }
      if (discount > 100) {
        discount = 0;
      }
      this.sellingPrice = mrp - (mrp * discount) / 100;
    } else if (this.discountType === '1') {
      if (isNaN(discount)) {
        discount = 0;
      }
      if (discount > mrp || discount > this.maxDiscountValue) {
        discount = Math.min(mrp, this.maxDiscountValue);
      }
      this.sellingPrice = mrp - discount;
    }
    this.discount = discount;
    this.errorMessage = errorMessage;
  }

  onDiscountKeypress(event: KeyboardEvent) {
    debugger;
    const mrp = parseFloat(this.mrp);
    const inputValue = parseFloat(
      event.key === '.' ? this.discount : this.discount + event.key
    );
    if (this.discountType === '0') {
      if (!isNaN(inputValue) && inputValue > 100) {
        event.preventDefault(); // Prevent the keypress if it would exceed 100%
        //   this.errorMessage = 'Discount cannot exceed 100%';
        this.toaster.error('Discounts cannot go beyond 100%');
      } else {
        this.errorMessage = '';
      }
    }
    if (this.discountType === '1') {
      if (!isNaN(inputValue) && inputValue > mrp) {
        event.preventDefault(); // Prevent the keypress if it would exceed 100%
        //   this.errorMessage = 'Discount cannot exceed 100%';
        this.toaster.error('The discount cannot go beyond the MRP.');
      } else {
        this.errorMessage = '';
      }
    }
    // If needed, call your existing calculateSellingPrice method or update the selling price here.
  }

  resetDiscount() {
    if (this.discountType == '1') {
      this.discountType = '1';
      this.sellingPrice = this.mrp - this.discount;
    } else if (this.discountType == '0') {
      this.discountType = '0';
      this.sellingPrice = this.mrp - (this.mrp * this.discount) / 100;
    }
  }

  getbrandList() {
    let payload = {
      pageNumber: 1,
      pageSize: 1000,
    };
    this.spinner.show();
    this.content.getBrand(payload).subscribe((response) => {
      if (response.isSuccess) {
        this.brandList = response.data.dataList;
        this.spinner.hide();
      } else {
        this.toaster.error(response.messages);
      }
    });
  }

  getQuantity() {
    this.spinner.show();
    this.content.getProductQuantityList().subscribe((response) => {
      if (response.isSuccess) {
        this.qunatityList = response.data;
      } else {
        this.toaster.error(response.messages);
      }
    });
  }

  getcategoryList() {
    this.spinner.show();
    this.content.getcategory().subscribe((response) => {
      if (response.isSuccess) {
        this.maincategoryList = response.data;
        this.spinner.hide();
      } else {
        this.spinner.hide();
        this.toaster.error(response.messages);
      }
    });
  }

  getSubcategoryList(id: any) {
    //  this.spinner.show();
    // this.mainId = id
    this.content.SubCategorySuper(id).subscribe((response) => {
      if (response.isSuccess) {
        this.SubcategoryList = response.data;
        var categoryListData = this.SubcategoryList?.find(
          (y: { subProductCategoryId: any }) =>
            y.subProductCategoryId == this.productDetail.subProductCategoryId
        );
        this.form.patchValue({
          subProductCategoryId: categoryListData?.subProductCategoryId,
        });
        // this.SubSubcategoryList = []
        this.spinner.hide();
      } else {
        this.SubcategoryList = [];
        this.toaster.error(response.messages);
      }
    });
  }

  getSubSubcategoryList(id: any) {
    // this.spinner.show();
    this.content.SubSubCategory(id).subscribe((response) => {
      if (response.isSuccess) {
        this.SubSubcategoryList = response.data;
        var subcategoryListData = this.SubSubcategoryList?.find(
          (y: { subSubProductCategoryId: any }) =>
            y.subSubProductCategoryId ==
            this.productDetail?.subSubProductCategoryId
        );
        this.form.patchValue({
          subSubProductCategoryId: subcategoryListData?.subSubProductCategoryId,
        });
        // this.spinner.hide();
      } else {
        // this.spinner.hide();
        this.SubSubcategoryList = [];
        this.toaster.error(response.messages);
      }
    });
  }

  onselect(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const imageDataUrl = reader.result as string;
        this.base64Image.push(imageDataUrl);
      };
    }
  }

  convertImageToBase64(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.http.get(url, { responseType: 'blob' }).subscribe(
        (response) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result !== null && reader.result !== undefined) {
              const base64data = reader.result.toString().split(',')[1];
              resolve(base64data);
            } else {
              reject(new Error('Error converting image to Base64.'));
            }
          };
          reader.onerror = () => {
            reject(new Error('Error converting image to Base64.'));
          };
          reader.readAsDataURL(response);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  fileChangeEvent() {
    debugger;
    const formData = new FormData();
    for (let i = 0; i < this.base64Image?.length; i++) {
      const imageDataUrl = this.base64Image[i];
      const blob = this.dataURItoBlob(imageDataUrl);
      formData.append('ProductImage', blob, `image_${i}.png`);
      formData.append('ProductImage', imageDataUrl);
    }
    formData.append('ProductId', this.productId);
    formData.append(
      'InventoryStatus',
      this.InventoryStatus != null ? this.InventoryStatus.toString() : 'true'
    );
    this.content.uploadProductImage(formData).subscribe((response) => {
      var a = response;
    });
  }

  private dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  removeImage(index: any) {
    this.selectedImageData.splice(index, 1);
    this.base64Image.splice(index, 1);
  }

  /** get product detail **/
  getProductDetail() {
    this.spinner.show();
    this.content
      .getProductInventoryDetail(this.productId)
      .subscribe((response) => {
        if (response.isSuccess) {
          this.spinner.hide();
          this.imageConvert64();
          this.productDetail = response.data;
          this.urls = response.data.productImage;
          // this.vendorId = response.data.vendorId;
          // this.description = response.data.productDescription
          this.getSubcategoryList(this.productDetail?.mainProductCategoryId);
          this.getSubSubcategoryList(this.productDetail?.subProductCategoryId);
          this.manuDate = this.productDetail.manufacturingDate.split('-');
          // Construct a Date object using the parsed date parts
          this.dateValue = new Date(
            parseInt(this.manuDate[2], 10), // Year
            parseInt(this.manuDate[1], 10) - 1, // Month (subtract 1 since month indexes are zero-based)
            parseInt(this.manuDate[0], 10) // Day
          );
          let getManufacturing = this.datepipe.transform(
            this.dateValue,
            'yyyy-MM-dd'
          );
          // this.productDetail.expiryDate  = new Date();
          this.exiDate = this.productDetail.expiryDate.split('-');
          this.dateValues = new Date(
            parseInt(this.exiDate[2], 10), // Year
            parseInt(this.exiDate[1], 10) - 1, // Month (subtract 1 since month indexes are zero-based)
            parseInt(this.exiDate[0], 10) // Day
          );
          let expiryDate = this.datepipe.transform(
            this.dateValues,
            'yyyy-MM-dd'
          );
          this.form.patchValue({
            sellingPrice: this.productDetail.sellingPrice,
            discount: this.productDetail.discount,
            discountType: this.productDetail.discountType,
            mrp: this.productDetail.mrp,
            manufacturingDate: getManufacturing,
            expiryDate: expiryDate,
            quantity: this.productDetail.quantity,
            shippingCharges: this.productDetail.shippingCharges,
            productName: this.productDetail.productName,
            skuid: this.productDetail.skuid,
            waitingDays: this.productDetail.waitingDays,
            speciality: this.productDetail.speciality,
            flavour: this.productDetail.flavour,
            howToUse: this.productDetail.howToUse,
            ingredients: this.productDetail.ingredients,
            storageAndUses: this.productDetail.storageAndUses,
            nutritionFact: this.productDetail.nutritionFact,
            otherProductInfo: this.productDetail.otherProductInfo,
            productQuantityTypeId: this.productDetail.productQuantityTypeId,
            productContainerTypeId: this.productDetail.productContainerTypeId,
            productDescription: this.productDetail.productDescription,
            brandId: this.productDetail.brandId,
            mainProductCategoryId: this.productDetail.mainProductCategoryId,
          });
        }
      });
  }

  // Image convertor to upload
  imageConvert64() {
    let payload = {
      productId: this.productId,
      inventoryStatus: true,
    };
    this.content.inventoryImageConvert(payload).subscribe((response) => {
      if (response.isSuccess) {
        this.base64Image = response.data;
      }
    });
  }

  // Update
  update() {
    this.submitted = true;
    if (this.form.invalid) {
      this.toaster.error(
        'Form Incomplete: Please fill in all the required fields correctly'
      );
      return;
    }

    // this.form.value.manufacturingDate = new Date();
    let date = this.datepipe?.transform(
      this.form.value.manufacturingDate,
      'yyyy-MM-dd'
    );
    // this.form.value.expiryDate = new Date();
    let expiryDate = this.datepipe?.transform(
      this.form.value.expiryDate,
      'yyyy-MM-dd'
    );
    let payload = {
      productId: this.productId,
      sellingPrice: this.form.value.sellingPrice,
      discount: this.form.value.discount,
      discountType: this.form.value.discountType,
      mrp: this.form.value.mrp,
      manufacturingDate: date,
      expiryDate: expiryDate,
      quantity: this.form.value.quantity,
      productQuantityTypeId: this.form.value.productQuantityTypeId,
      productContainerTypeId: this.form.value.productContainerTypeId,
      shippingCharges: this.form.value.shippingCharges,
      productName: this.form.value.productName,
      skuid: this.form.value.skuid,
      brandId: this.form.value.brandId,
      mainProductCategoryId: this.form.value.mainProductCategoryId,
      subProductCategoryId: this.form.value.subProductCategoryId,
      subSubProductCategoryId: this.form.value.subSubProductCategoryId,
      groupId: this.form.value.groupId,
      waitingDays: this.form.value.waitingDays,
      speciality: this.form.value.speciality,
      flavour: this.form.value.flavour,
      howToUse: this.form.value.howToUse,
      ingredients: this.form.value.ingredients,
      storageAndUses: this.form.value.storageAndUses,
      nutritionFact: this.form.value.nutritionFact,
      otherProductInfo: this.form.value.otherProductInfo,
      productDescription: this.form.value.productDescription,
    };
    this.spinner.show();
    this.content.updateProductInventory(payload).subscribe((response) => {
      this.productId = response.data?.productId;
      if (response.isSuccess) {
        this.spinner.hide();
        this.toaster.success(response.messages);
        this.fileChangeEvent();
        this._location.back();
      } else {
        this.toaster.error(response.messages);
        this.spinner.hide();
      }
    });
  }

  cancel() {
    this.router.navigateByUrl('/product-list-inventory').then(() => {
      window.location.reload();
    });
  }
}
