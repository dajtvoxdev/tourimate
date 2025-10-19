using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddTourCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a010ccd4-fc2b-41bd-b664-ca4d89f65179"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("d845e6b1-0e92-4fbc-abed-efdfdf5c7185"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("fa167024-0044-45d2-9100-da9e0f509ac3"));

            migrationBuilder.AddColumn<Guid>(
                name: "TourCategoryId",
                table: "Tours",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TourCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Icon = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ParentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourCategories_TourCategories_ParentId",
                        column: x => x.ParentId,
                        principalTable: "TourCategories",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(314), new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(317) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(323), new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(324) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(330), new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(330) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("35c081f8-2c55-474b-a4e6-2cab62f8b077"), "Finance", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(805), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(806), "0.15" },
                    { new Guid("cbbf21c0-f3f7-4b3c-8d91-a9d0846f5b93"), "Finance", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(845), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(845), "0.15" },
                    { new Guid("e1a11a54-41b6-432c-85cc-fbd3c5086273"), "Security", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(848), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(848), "5" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tours_TourCategoryId",
                table: "Tours",
                column: "TourCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TourCategories_ParentId",
                table: "TourCategories",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_TourCategories_TourCategoryId",
                table: "Tours",
                column: "TourCategoryId",
                principalTable: "TourCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tours_TourCategories_TourCategoryId",
                table: "Tours");

            migrationBuilder.DropTable(
                name: "TourCategories");

            migrationBuilder.DropIndex(
                name: "IX_Tours_TourCategoryId",
                table: "Tours");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("35c081f8-2c55-474b-a4e6-2cab62f8b077"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("cbbf21c0-f3f7-4b3c-8d91-a9d0846f5b93"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e1a11a54-41b6-432c-85cc-fbd3c5086273"));

            migrationBuilder.DropColumn(
                name: "TourCategoryId",
                table: "Tours");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5336), new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5336) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5341), new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5341) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5344), new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5345) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("a010ccd4-fc2b-41bd-b664-ca4d89f65179"), "Finance", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5519), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5520), "0.15" },
                    { new Guid("d845e6b1-0e92-4fbc-abed-efdfdf5c7185"), "Security", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5542), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5542), "5" },
                    { new Guid("fa167024-0044-45d2-9100-da9e0f509ac3"), "Finance", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5538), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5538), "0.15" }
                });
        }
    }
}
