describe('PickingController', () => {
  let $controller;
  let $rootScope;
  let $httpBackend;
  let controller;
  let ApiService;

  beforeEach(angular.mock.module('fulfillflow'));

  beforeEach(inject((
    _$controller_,
    _$rootScope_,
    _$httpBackend_,
    _ApiService_,
  ) => {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    ApiService = _ApiService_;
  }));

  beforeEach(() => {
    const $scope = $rootScope.$new();
    controller = $controller('PickingController', {
      $scope,
      ApiService,
    });
  });

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('loadOrderQueues', () => {
    it('should load order queues', () => {
      const queues = [
        { id: '1', priority: 'Rush', status: 'Pending' },
        { id: '2', priority: 'Regular', status: 'In Progress' },
      ];

      $httpBackend.expectGET('/api/v1/picking/queues').respond(200, queues);

      controller.loadOrderQueues();
      $httpBackend.flush();

      expect(controller.queues).toEqual(queues);
    });
  });

  describe('assignQueue', () => {
    it('should assign queue to picker', () => {
      const queueId = '1';
      const userId = 'user-1';
      const updatedQueue = { id: queueId, assignedTo: userId, status: 'Assigned' };

      $httpBackend
        .expectPATCH(`/api/v1/picking/queues/${queueId}/assign`)
        .respond(200, updatedQueue);

      controller.assignQueue(queueId, userId);
      $httpBackend.flush();

      expect(controller.loadOrderQueues).toHaveBeenCalled();
    });
  });
});
