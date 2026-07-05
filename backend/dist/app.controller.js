"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = exports.UpdateStatusDto = exports.BulkCreateTestDto = exports.CreateTestDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_service_1 = require("./app.service");
class CreateTestDto {
    message;
    status;
    payload;
    ipAddress;
}
exports.CreateTestDto = CreateTestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The test message to store in the database',
        example: 'Connection test successful!',
    }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The status of the test connection',
        example: 'active',
        required: false,
    }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional custom json metadata for testing payload types',
        example: { environment: 'development', engine: 'typeorm' },
        required: false,
    }),
    __metadata("design:type", Object)
], CreateTestDto.prototype, "payload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The IP address from where the test request originated',
        example: '192.168.1.1',
        required: false,
    }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "ipAddress", void 0);
class BulkCreateTestDto {
    messages;
}
exports.BulkCreateTestDto = BulkCreateTestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of messages to insert in bulk',
        example: ['Bulk message 1', 'Bulk message 2', 'Bulk message 3'],
    }),
    __metadata("design:type", Array)
], BulkCreateTestDto.prototype, "messages", void 0);
class UpdateStatusDto {
    status;
}
exports.UpdateStatusDto = UpdateStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The new status to update the entry to',
        example: 'completed',
    }),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    async getTests() {
        return this.appService.getTests();
    }
    async createTest(body) {
        return this.appService.createTest(body.message, body.status, body.payload, body.ipAddress);
    }
    async createBulk(body) {
        return this.appService.createBulkTests(body.messages);
    }
    async updateStatus(id, body) {
        return this.appService.updateStatus(id, body.status);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve all test connection entries from the database' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getTests", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new test connection entry in the database' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTestDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createTest", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Create multiple test connection entries in a single request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkCreateTestDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update the status of an existing test connection entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateStatus", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('Test Connection'),
    (0, common_1.Controller)('test-connection'),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map