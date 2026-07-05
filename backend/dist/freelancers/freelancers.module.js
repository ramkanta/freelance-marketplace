"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreelancersModule = void 0;
const common_1 = require("@nestjs/common");
const freelancers_service_1 = require("./freelancers.service");
const freelancers_controller_1 = require("./freelancers.controller");
let FreelancersModule = class FreelancersModule {
};
exports.FreelancersModule = FreelancersModule;
exports.FreelancersModule = FreelancersModule = __decorate([
    (0, common_1.Module)({
        controllers: [freelancers_controller_1.FreelancersController],
        providers: [freelancers_service_1.FreelancersService],
        exports: [freelancers_service_1.FreelancersService],
    })
], FreelancersModule);
//# sourceMappingURL=freelancers.module.js.map