import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User } from '../../models/user.model';

const mockUser: User = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
};

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllUsers()', () => {
    it('should issue GET /users/50/1 with default args', () => {
      service.getAllUsers().subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/users/50/1'));
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should issue GET with provided limit and page', () => {
      service.getAllUsers(10, 2).subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/users/10/2'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getUserById()', () => {
    it('should issue GET /users/:id with numeric id', () => {
      service.getUserById(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/users/1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should issue GET /users/:id with string id', () => {
      service.getUserById('alice').subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/users/alice'));
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });
});
