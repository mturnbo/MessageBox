import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoginModalComponent } from './login-modal';

describe('LoginModalComponent', () => {
  let component: LoginModalComponent;
  let fixture: ComponentFixture<LoginModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(LoginModalComponent);
    component = fixture.componentInstance;
    component.visible = true;
    httpMock  = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should be invalid when both fields are empty', () => {
      expect(component.form.invalid).toBe(true);
    });

    it('should be invalid when only username is filled', () => {
      component.form.controls.username.setValue('alice');
      expect(component.form.invalid).toBe(true);
    });

    it('should be invalid when only password is filled', () => {
      component.form.controls.password.setValue('secret');
      expect(component.form.invalid).toBe(true);
    });

    it('should be valid when both fields are filled', () => {
      component.form.setValue({ username: 'alice', password: 'secret' });
      expect(component.form.valid).toBe(true);
    });

    it('onSubmit() should not call API when form is invalid', () => {
      component.onSubmit();
      httpMock.expectNone('/auth');
      expect(component.loading).toBe(false);
    });
  });

  describe('successful login', () => {
    it('should emit loginSuccess on successful auth', () => {
      let emitted = false;
      component.loginSuccess.subscribe(() => (emitted = true));

      component.form.setValue({ username: 'alice', password: 'pass' });
      component.onSubmit();

      httpMock.expectOne('/auth').flush({ username: 'alice', token: 'tok123' });

      expect(emitted).toBe(true);
      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('error handling', () => {
    it('should show "Invalid username or password." on 401', () => {
      component.form.setValue({ username: 'alice', password: 'wrong' });
      component.onSubmit();

      httpMock
        .expectOne('/auth')
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(component.errorMessage).toBe('Invalid username or password.');
      expect(component.loading).toBe(false);
    });

    it('should show "Invalid username or password." on 400', () => {
      component.form.setValue({ username: 'nobody', password: 'pass' });
      component.onSubmit();

      httpMock
        .expectOne('/auth')
        .flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(component.errorMessage).toBe('Invalid username or password.');
    });

    it('should show generic message on non-400/401 error', () => {
      component.form.setValue({ username: 'alice', password: 'pass' });
      component.onSubmit();

      httpMock
        .expectOne('/auth')
        .flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(component.errorMessage).toBe('Unable to connect. Please try again.');
    });

    it('should reset password but preserve username on error', () => {
      component.form.setValue({ username: 'alice', password: 'wrong' });
      component.onSubmit();

      httpMock
        .expectOne('/auth')
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(component.form.controls.password.value).toBeNull();
      expect(component.form.controls.username.value).toBe('alice');
    });
  });
});
